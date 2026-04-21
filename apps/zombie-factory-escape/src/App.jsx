import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  Archive,
  Backpack,
  CheckCircle2,
  FlaskConical,
  Lock,
  Send,
  Siren,
  Timer,
} from 'lucide-react'

const TOTAL_TIME = 600
const FINAL_PASSWORD = '427'
const SUBMIT_ENDPOINT = window.__ZOMBIE_ESCAPE_SUBMIT_ENDPOINT ?? ''

const questOrder = [
  { step: 1, title: '어둠 속의 불빛', label: '양초 관찰실' },
  { step: 2, title: '기계실 암호', label: '반응식 제어반' },
  { step: 3, title: '약품 창고 A', label: '질량 보존' },
  { step: 4, title: '약품 창고 B', label: '기체 반응' },
  { step: 5, title: '탈출 자물쇠', label: '최종 제어실' },
]

const inventoryLabels = {
  H2: '[수소 캡슐 H₂]',
  O2: '[산소 밸브 O₂]',
  MASS: '[질량 보존 메모 4]',
  GAS: '[기체 반응 메모 7]',
  CURE: '[백신 조합 키 2]',
}

function useSoundEffects() {
  const audioContextRef = useRef(null)
  const enabledRef = useRef(false)

  const ensureContext = async () => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext
      if (!AudioContextClass) {
        return null
      }
      audioContextRef.current = new AudioContextClass()
    }

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume()
    }

    return audioContextRef.current
  }

  const playTone = async (sequence) => {
    if (!enabledRef.current) {
      return
    }

    const context = await ensureContext()
    if (!context) {
      return
    }

    const masterGain = context.createGain()
    masterGain.gain.value = 0.045
    masterGain.connect(context.destination)

    let startTime = context.currentTime

    sequence.forEach(({ freq, duration, type = 'triangle', gap = 0.03 }) => {
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = type
      oscillator.frequency.setValueAtTime(freq, startTime)
      gain.gain.setValueAtTime(0.0001, startTime)
      gain.gain.exponentialRampToValueAtTime(0.65, startTime + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
      oscillator.connect(gain)
      gain.connect(masterGain)
      oscillator.start(startTime)
      oscillator.stop(startTime + duration + 0.02)
      startTime += duration + gap
    })
  }

  const unlockSound = async () => {
    enabledRef.current = true
    await ensureContext()
  }

  const playByName = async (name) => {
    const map = {
      intro: [
        { freq: 220, duration: 0.18, type: 'sine' },
        { freq: 294, duration: 0.18, type: 'sine' },
        { freq: 370, duration: 0.24, type: 'triangle' },
      ],
      step: [
        { freq: 260, duration: 0.1 },
        { freq: 392, duration: 0.12 },
        { freq: 523, duration: 0.2 },
      ],
      error: [
        { freq: 180, duration: 0.16, type: 'sawtooth' },
        { freq: 140, duration: 0.18, type: 'sawtooth' },
      ],
      success: [
        { freq: 392, duration: 0.12 },
        { freq: 523, duration: 0.14 },
        { freq: 659, duration: 0.16 },
        { freq: 784, duration: 0.3, type: 'sine' },
      ],
      submit: [
        { freq: 330, duration: 0.08, type: 'sine' },
        { freq: 494, duration: 0.1, type: 'sine' },
        { freq: 659, duration: 0.16, type: 'triangle' },
      ],
    }

    await playTone(map[name] ?? map.step)
  }

  return { unlockSound, playByName }
}

const formatTime = (seconds) => {
  const safe = Math.max(seconds, 0)
  const minute = Math.floor(safe / 60)
  const second = safe % 60
  return `${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
}

const buildResultPayload = ({
  studentInfo,
  timeSpent,
  inventory,
  notes,
  submissionStatus,
}) => ({
  project: 'zombie-factory-escape',
  submittedAt: new Date().toISOString(),
  student: {
    id: studentInfo.id,
    name: studentInfo.name,
  },
  playSummary: {
    cleared: true,
    timeSpentSeconds: timeSpent,
    inventory,
    finalPassword: FINAL_PASSWORD,
    submissionStatus,
  },
  wrongAnswerNotes: notes,
})

function App() {
  const [step, setStep] = useState(0)
  const [studentInfo, setStudentInfo] = useState({ id: '', name: '' })
  const [inventory, setInventory] = useState([])
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [shake, setShake] = useState(false)
  const [timer, setTimer] = useState(TOTAL_TIME)
  const [isGameOver, setIsGameOver] = useState(false)
  const [massAnswer, setMassAnswer] = useState('')
  const [gasChoice, setGasChoice] = useState('')
  const [submissionStatus, setSubmissionStatus] = useState('idle')
  const [submissionJson, setSubmissionJson] = useState('')
  const [wrongAnswerNotes, setWrongAnswerNotes] = useState([])

  const previousStepRef = useRef(0)
  const timeoutRef = useRef(null)
  const { unlockSound, playByName } = useSoundEffects()

  useEffect(() => {
    let interval
    if (step > 0 && step < 6 && !isGameOver) {
      interval = window.setInterval(() => {
        setTimer((previous) => {
          if (previous <= 1) {
            setIsGameOver(true)
            setStep(-1)
            return 0
          }
          return previous - 1
        })
      }, 1000)
    }
    return () => window.clearInterval(interval)
  }, [step, isGameOver])

  useEffect(() => {
    if (previousStepRef.current !== step && step >= 0) {
      const soundName = step === 0 ? 'intro' : step === 6 ? 'success' : 'step'
      playByName(soundName)
      previousStepRef.current = step
    }
  }, [playByName, step])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const addInventoryItem = (itemKey) => {
    setInventory((current) =>
      current.includes(inventoryLabels[itemKey])
        ? current
        : [...current, inventoryLabels[itemKey]],
    )
  }

  const triggerError = (message, note) => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
    }

    setErrorMsg(message)
    setShake(true)
    playByName('error')

    if (note) {
      setWrongAnswerNotes((current) => [
        ...current,
        {
          step,
          title: questOrder.find((quest) => quest.step === step)?.title ?? '미확인 단계',
          note,
        },
      ])
    }

    timeoutRef.current = window.setTimeout(() => {
      setShake(false)
      setErrorMsg('')
    }, 2200)
  }

  const moveToStep = (nextStep, itemKey) => {
    if (itemKey) {
      addInventoryItem(itemKey)
    }
    setStep(nextStep)
  }

  const handleStart = async () => {
    if (!studentInfo.id.trim() || !studentInfo.name.trim()) {
      triggerError('학번과 이름을 모두 입력해야 출입문이 열립니다.', '학생 정보 미입력')
      return
    }

    await unlockSound()
    moveToStep(1)
  }

  const handleMassSubmit = () => {
    if (massAnswer.trim() === '4') {
      moveToStep(4, 'MASS')
      return
    }

    triggerError(
      '마그네슘 2g과 산소 2g이 반응하면 산화마그네슘은 총 4g입니다.',
      `질량 보존 답안: ${massAnswer || '(빈칸)'}`,
    )
  }

  const handleGasSubmit = () => {
    if (gasChoice === 'B') {
      moveToStep(5, 'GAS')
      addInventoryItem('CURE')
      return
    }

    triggerError(
      '기체 반응 법칙은 부피비가 간단한 정수비가 되는지 살피면 됩니다. 수소 2L와 산소 1L가 물 2L를 만듭니다.',
      `기체 반응 선택: ${gasChoice || '(선택 없음)'}`,
    )
  }

  const handleFinalUnlock = () => {
    if (password.trim() === FINAL_PASSWORD) {
      setStep(6)
      return
    }

    triggerError(
      '수집한 세 개의 숫자 메모를 순서대로 조합해 보세요. 질량 보존, 백신 조합, 기체 반응 메모입니다.',
      `최종 암호 시도: ${password || '(빈칸)'}`,
    )
  }

  const handleSubmitResult = async () => {
    const payload = buildResultPayload({
      studentInfo,
      timeSpent: TOTAL_TIME - timer,
      inventory,
      notes: wrongAnswerNotes,
      submissionStatus: SUBMIT_ENDPOINT ? 'pending-api' : 'json-only',
    })

    setSubmissionJson(JSON.stringify(payload, null, 2))

    if (!SUBMIT_ENDPOINT) {
      setSubmissionStatus('json-only')
      playByName('submit')
      return
    }

    try {
      setSubmissionStatus('submitting')
      const response = await fetch(SUBMIT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      setSubmissionStatus('submitted')
      playByName('submit')
    } catch (error) {
      setSubmissionStatus(`api-error: ${error.message}`)
      triggerError(
        'API 전송에는 실패했지만, 아래 JSON 결과는 그대로 복사하거나 저장할 수 있습니다.',
        `API 제출 실패: ${error.message}`,
      )
    }
  }

  const resetGame = () => {
    setStep(0)
    setStudentInfo({ id: '', name: '' })
    setInventory([])
    setPassword('')
    setErrorMsg('')
    setShake(false)
    setTimer(TOTAL_TIME)
    setIsGameOver(false)
    setMassAnswer('')
    setGasChoice('')
    setSubmissionStatus('idle')
    setSubmissionJson('')
    setWrongAnswerNotes([])
  }

  const statusPanel = step > 0 && step < 6 && (
    <div className="mb-6 grid gap-3 md:grid-cols-3">
      <div className="rounded-2xl border border-emerald-400/20 bg-white/10 p-4 backdrop-blur">
        <p className="flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-emerald-100/70">
          <Timer size={16} />
          잔여 시간
        </p>
        <p className="mt-2 font-mono text-2xl font-bold text-amber-200">{formatTime(timer)}</p>
      </div>
      <div className="rounded-2xl border border-emerald-400/20 bg-white/10 p-4 backdrop-blur">
        <p className="flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-emerald-100/70">
          <Backpack size={16} />
          인벤토리
        </p>
        <p className="mt-2 text-sm text-emerald-50">
          {inventory.length > 0 ? inventory.join(' ') : '아직 확보한 단서가 없습니다.'}
        </p>
      </div>
      <div className="rounded-2xl border border-emerald-400/20 bg-white/10 p-4 backdrop-blur">
        <p className="flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-emerald-100/70">
          <Archive size={16} />
          오답 노트
        </p>
        <p className="mt-2 text-sm text-emerald-50">{wrongAnswerNotes.length}개 기록됨</p>
      </div>
    </div>
  )

  const questRail = (
    <div className="mb-6 flex flex-wrap gap-2">
      {questOrder.map((quest) => {
        const active = step === quest.step
        const completed = step > quest.step || step === 6
        return (
          <div
            key={quest.step}
            className={`rounded-full border px-3 py-2 text-xs font-bold uppercase tracking-[0.18em] ${
              active
                ? 'border-amber-300 bg-amber-300 text-stone-950'
                : completed
                  ? 'border-emerald-300/40 bg-emerald-300/10 text-emerald-100'
                  : 'border-white/10 bg-white/5 text-emerald-50/60'
            }`}
          >
            {quest.label}
          </div>
        )
      })}
    </div>
  )

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 text-stone-50 md:px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(253,224,71,0.08),transparent_30%),radial-gradient(circle_at_left,_rgba(52,211,153,0.16),transparent_28%)]" />

      <div className="relative mx-auto max-w-6xl">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-red-300/30 bg-red-950/40 px-3 py-1 text-xs font-bold uppercase tracking-[0.3em] text-red-100">
              <Siren size={14} />
              Zombie Factory Alert
            </p>
            <h1 className="font-display text-4xl font-black tracking-tight text-lime-100 md:text-6xl">
              좀비 공장
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-emerald-50/75 md:text-base">
              화학 반응의 규칙을 풀어 백신 성분을 모으고 공장 밖으로 탈출하세요.
            </p>
          </div>
          <div className="hidden rounded-3xl border border-lime-200/15 bg-black/20 px-5 py-4 text-right shadow-reactor backdrop-blur md:block">
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-100/60">Class Mode</p>
            <p className="mt-2 font-mono text-lg text-amber-100">React + Vite + Tailwind</p>
          </div>
        </header>

        <section
          className={`relative overflow-hidden rounded-[2rem] border border-white/10 bg-stone-950/65 p-6 shadow-reactor backdrop-blur-md transition-all duration-300 md:p-8 ${
            shake ? 'animate-shake' : ''
          }`}
        >
          <div className="absolute -right-16 -top-10 h-40 w-40 rounded-full bg-lime-300/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-amber-300/10 blur-3xl" />

          {step > 0 && step !== 6 && step !== -1 && questRail}
          {statusPanel}

          {step === 0 && (
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="animate-fade-in">
                <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-3xl border border-lime-200/20 bg-lime-300/10 text-5xl animate-drift">
                  🧟
                </div>
                <h2 className="font-display text-3xl font-black text-amber-100 md:text-5xl">
                  화학 반응식 퀘스트
                </h2>
                <p className="mt-4 max-w-xl text-base leading-7 text-emerald-50/80">
                  정전이 난 백신 공장에서 좀비 바이러스가 퍼졌습니다. 제한 시간은 10분.
                  화학 지식을 이용해 창고의 조합 단서를 회수하고 최종 제어실의 잠금을 해제하세요.
                </p>
                <div className="mt-6 grid gap-3 text-sm text-emerald-50/80 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="font-bold text-amber-100">단원</p>
                    <p className="mt-2">화학 반응의 규칙</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="font-bold text-amber-100">형식</p>
                    <p className="mt-2">방탈출 + 오답 노트</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="font-bold text-amber-100">완료 시</p>
                    <p className="mt-2">JSON 결과 제출</p>
                  </div>
                </div>
              </div>

              <div className="animate-fade-in rounded-[1.75rem] border border-amber-200/15 bg-white/95 p-6 text-stone-900">
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-700">
                  대원 등록
                </p>
                <div className="mt-5 space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-stone-700">학번</span>
                    <input
                      className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 font-semibold outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                      placeholder="예: 30501"
                      value={studentInfo.id}
                      onChange={(event) =>
                        setStudentInfo((current) => ({
                          ...current,
                          id: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-stone-700">이름</span>
                    <input
                      className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 font-semibold outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                      placeholder="이름"
                      value={studentInfo.name}
                      onChange={(event) =>
                        setStudentInfo((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <button
                    className="w-full rounded-2xl bg-red-600 px-4 py-4 text-lg font-black text-white transition hover:bg-red-500 active:scale-[0.99]"
                    onClick={handleStart}
                  >
                    공장 진입
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="animate-fade-in space-y-6">
              <h2 className="font-display text-3xl font-black text-amber-100">Step 1. 어둠 속의 불빛</h2>
              <div className="rounded-[1.75rem] border border-blue-200/10 bg-blue-300/10 p-5 text-emerald-50">
                공장이 너무 어두워 양초에 불을 붙였습니다. 양초가 타며 빛과 열이 나오고 길이가
                짧아졌습니다. 이 핵심 변화는 무엇일까요?
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <button
                  className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 text-left transition hover:bg-white/10"
                  onClick={() =>
                    triggerError(
                      '촛농이 녹는 것은 물리 변화일 수 있지만, 양초가 타는 중심 현상은 새로운 물질이 생기는 화학 변화입니다.',
                      '양초 변화 문제에서 물리 변화 선택',
                    )
                  }
                >
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-200/70">선택 A</p>
                  <p className="mt-3 text-2xl font-black text-stone-50">물리 변화</p>
                </button>
                <button
                  className="rounded-[1.5rem] border border-emerald-300/30 bg-emerald-300/15 p-6 text-left transition hover:bg-emerald-300/20"
                  onClick={() => moveToStep(2, 'H2')}
                >
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-200">선택 B</p>
                  <p className="mt-3 text-2xl font-black text-stone-50">화학 변화</p>
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in space-y-6">
              <h2 className="font-display text-3xl font-black text-amber-100">Step 2. 기계실 암호</h2>
              <div className="rounded-[1.75rem] border border-white/10 bg-stone-900/70 p-6">
                <p className="text-sm uppercase tracking-[0.25em] text-emerald-100/65">물의 합성 반응식</p>
                <p className="mt-4 font-mono text-3xl font-bold text-emerald-50">
                  2H₂ + O₂ → <span className="text-red-400">a</span>H₂O
                </p>
                <p className="mt-4 text-sm leading-7 text-emerald-50/75">
                  수소 원자 4개와 산소 원자 2개가 반응물에 있으므로 생성물에서도 같아야 합니다.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                <label className="block">
                  <span className="mb-3 block text-sm font-semibold text-amber-100">계수 a 입력</span>
                  <input
                    className="w-full rounded-2xl border border-emerald-200/15 bg-stone-950/70 px-4 py-4 text-center font-mono text-3xl font-bold text-lime-100 outline-none transition focus:border-emerald-400"
                    inputMode="numeric"
                    placeholder="2"
                    onChange={(event) => {
                      const value = event.target.value
                      if (value === '2') {
                        addInventoryItem('O2')
                        moveToStep(3)
                      } else if (value.length > 0 && value !== '2') {
                        triggerError(
                          '생성물 H₂O가 2개 있어야 수소 4개와 산소 2개가 맞춰집니다.',
                          `반응식 계수 답안: ${value}`,
                        )
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in space-y-6">
              <h2 className="font-display text-3xl font-black text-amber-100">Step 3. 약품 창고 A</h2>
              <div className="rounded-[1.75rem] border border-amber-200/10 bg-amber-300/10 p-6">
                <p className="text-sm uppercase tracking-[0.25em] text-amber-100/70">질량 보존 법칙</p>
                <p className="mt-4 leading-8 text-emerald-50/85">
                  창고 기록지에 다음 내용이 적혀 있습니다. “마그네슘 2g과 산소 2g이 완전히
                  반응하여 산화마그네슘이 생성되었다.” 생성물의 질량은 몇 g일까요?
                </p>
              </div>
              <div className="flex flex-col gap-4 md:flex-row">
                <input
                  className="flex-1 rounded-2xl border border-white/10 bg-stone-950/70 px-4 py-4 text-center font-mono text-2xl font-bold text-lime-100 outline-none"
                  inputMode="numeric"
                  placeholder="정답 입력"
                  value={massAnswer}
                  onChange={(event) => setMassAnswer(event.target.value)}
                />
                <button
                  className="rounded-2xl bg-amber-400 px-6 py-4 font-black text-stone-950 transition hover:bg-amber-300"
                  onClick={handleMassSubmit}
                >
                  창고 개방
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-fade-in space-y-6">
              <h2 className="font-display text-3xl font-black text-amber-100">Step 4. 약품 창고 B</h2>
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
                <p className="text-sm uppercase tracking-[0.25em] text-emerald-100/65">기체 반응 법칙</p>
                <p className="mt-4 leading-8 text-emerald-50/85">
                  같은 온도와 압력에서 수소 2L와 산소 1L가 반응하면 수증기 2L가 생성됩니다.
                  다음 보기 중 올바른 부피 관계를 고르세요.
                </p>
                <div className="mt-5 grid gap-3">
                  {[
                    ['A', '수소 1L + 산소 1L → 수증기 3L'],
                    ['B', '수소 2L + 산소 1L → 수증기 2L'],
                    ['C', '수소 2L + 산소 2L → 수증기 1L'],
                  ].map(([choice, label]) => (
                    <button
                      key={choice}
                      className={`rounded-2xl border px-4 py-4 text-left transition ${
                        gasChoice === choice
                          ? 'border-amber-300 bg-amber-300 text-stone-950'
                          : 'border-white/10 bg-stone-950/50 text-emerald-50 hover:bg-white/10'
                      }`}
                      onClick={() => setGasChoice(choice)}
                    >
                      <span className="mr-3 font-mono text-sm font-bold">{choice}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                className="rounded-2xl bg-emerald-400 px-6 py-4 font-black text-stone-950 transition hover:bg-emerald-300"
                onClick={handleGasSubmit}
              >
                백신 조합 확보
              </button>
            </div>
          )}

          {step === 5 && (
            <div className="animate-fade-in space-y-6">
              <h2 className="font-display text-3xl font-black text-amber-100">Step 5. 최종 제어실</h2>
              <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-[1.75rem] border border-white/10 bg-stone-900/80 p-6">
                  <p className="flex items-center gap-2 text-sm uppercase tracking-[0.25em] text-emerald-100/65">
                    <Lock size={16} />
                    최종 자물쇠 힌트
                  </p>
                  <ul className="mt-4 space-y-3 text-sm leading-7 text-emerald-50/80">
                    <li>질량 보존 메모에서 첫 번째 숫자를 읽습니다.</li>
                    <li>백신 조합 키 숫자를 두 번째에 둡니다.</li>
                    <li>기체 반응 메모 숫자를 세 번째에 둡니다.</li>
                  </ul>
                  <p className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                    인벤토리에 저장된 숫자 메모를 순서대로 조합하면 암호가 됩니다.
                  </p>
                </div>
                <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
                  <p className="text-sm font-semibold text-amber-100">암호 입력</p>
                  <input
                    className="mt-4 w-full rounded-2xl border border-white/10 bg-stone-950/80 px-4 py-4 text-center font-mono text-4xl font-bold tracking-[0.35em] text-lime-100 outline-none"
                    maxLength={3}
                    value={password}
                    onChange={(event) => setPassword(event.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="427"
                  />
                  <button
                    className="mt-4 w-full rounded-2xl bg-red-500 px-4 py-4 font-black text-white transition hover:bg-red-400"
                    onClick={handleFinalUnlock}
                  >
                    탈출 문 열기
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="animate-fade-in space-y-6">
              <div className="rounded-[2rem] border border-emerald-300/25 bg-emerald-300/10 p-6 text-center animate-pulseGlow">
                <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-200" />
                <h2 className="mt-4 font-display text-4xl font-black text-lime-100">
                  MISSION CLEAR
                </h2>
                <p className="mt-3 text-lg text-emerald-50/85">
                  {studentInfo.name} 대원, 백신 회수와 탈출에 성공했습니다.
                </p>
                <p className="mt-2 font-mono text-xl text-amber-100">
                  클리어 타임 {formatTime(TOTAL_TIME - timer)}
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
                  <p className="text-sm uppercase tracking-[0.25em] text-emerald-100/65">제출 패널</p>
                  <p className="mt-4 text-sm leading-7 text-emerald-50/80">
                    결과 제출 버튼을 누르면 이름, 학번, 소요 시간, 오답 노트가 JSON으로
                    출력됩니다. `window.__ZOMBIE_ESCAPE_SUBMIT_ENDPOINT`가 설정되어 있으면 해당
                    API로도 전송을 시도합니다.
                  </p>
                  <div className="mt-5 flex flex-col gap-3">
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-4 font-black text-stone-950 transition hover:bg-emerald-300"
                      onClick={handleSubmitResult}
                    >
                      <Send size={18} />
                      결과 제출
                    </button>
                    <button
                      className="rounded-2xl border border-white/10 bg-stone-950/60 px-4 py-4 font-bold text-emerald-50 transition hover:bg-white/10"
                      onClick={resetGame}
                    >
                      다시 시작
                    </button>
                  </div>
                  <p className="mt-4 text-xs text-emerald-100/60">제출 상태: {submissionStatus}</p>
                </div>

                <div className="rounded-[1.75rem] border border-white/10 bg-stone-950/90 p-6">
                  <p className="text-sm uppercase tracking-[0.25em] text-amber-100/65">Result JSON</p>
                  <pre className="mt-4 max-h-[26rem] overflow-auto rounded-2xl bg-black/40 p-4 font-mono text-xs leading-6 text-lime-100">
                    {submissionJson || '아직 제출 전입니다.'}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {step === -1 && (
            <div className="animate-fade-in space-y-6 text-center">
              <AlertTriangle className="mx-auto h-16 w-16 text-red-300" />
              <h2 className="font-display text-4xl font-black text-red-200">TIME OVER</h2>
              <p className="mx-auto max-w-xl text-emerald-50/75">
                좀비가 기계실까지 도달했습니다. 오답 노트를 다시 확인하고 질량 보존, 반응식 계수,
                기체 반응 부피비를 복습한 뒤 재도전하세요.
              </p>
              <button
                className="mx-auto rounded-2xl bg-red-500 px-6 py-4 font-black text-white transition hover:bg-red-400"
                onClick={resetGame}
              >
                다시 도전
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="pointer-events-none absolute inset-x-6 bottom-6 rounded-2xl border border-red-200/30 bg-red-500/90 px-4 py-4 text-sm font-bold text-white shadow-2xl">
              <p className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </p>
            </div>
          )}

          <div className="mt-8 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-emerald-50/60">
            <FlaskConical size={15} />
            다른 AI 도구에 전달할 때는 앱 폴더 안의 `RAW_SPEC.md`를 함께 넘기면 구조와 전체 흐름을 바로
            이해할 수 있습니다.
          </div>
        </section>
      </div>
    </main>
  )
}

export default App
