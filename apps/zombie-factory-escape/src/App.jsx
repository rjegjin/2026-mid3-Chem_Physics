import { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle,
  Archive,
  Backpack,
 CheckCircle2,
  FlaskConical,
  Lock,
  Send,
  ShieldAlert,
  Siren,
  TestTubeDiagonal,
  Timer,
} from 'lucide-react'

const TOTAL_TIME = 600
const SUBMIT_ENDPOINT = window.__ZOMBIE_ESCAPE_SUBMIT_ENDPOINT ?? ''

const questOrder = [
  { step: 1, title: '정전 복도', label: '오염 복도' },
  { step: 2, title: '혼합 제어반', label: '반응식 패널' },
  { step: 3, title: '약품 창고', label: '질량 검문' },
  { step: 4, title: '환기 터널', label: '기체 밸브' },
  { step: 5, title: '백신 금고', label: '최종 금고' },
]

const difficultyConfigs = {
  easy: {
    label: '쉬움',
    intro: '핵심 개념을 바로 적용하는 구조입니다.',
    equationAnswer: 2,
    massQuestion: {
      reactants: [
        ['마그네슘', 6],
        ['산소', 4],
      ],
      answer: '10',
      prompt: '마그네슘 6g과 산소 4g이 완전히 반응해 산화마그네슘을 만들었다.',
      memoText: '보존된 총질량의 십의 자리를 첫 숫자로 사용한다.',
    },
    gasOptions: [
      ['A', '수소 1L + 산소 1L → 수증기 2L'],
      ['B', '수소 2L + 산소 1L → 수증기 2L'],
      ['C', '수소 2L + 산소 2L → 수증기 4L'],
    ],
    gasAnswer: 'B',
    gasMemoText: '수소 2, 산소 1, 생성물 2. 부피비의 마지막 숫자가 둘째 숫자다.',
    cureMemoText: '백신 혼합 패널에서 맞춘 계수가 마지막 숫자다.',
    finalPassword: '122',
  },
  normal: {
    label: '보통',
    intro: '숫자 계산과 단서 해석이 함께 섞입니다.',
    equationAnswer: 2,
    massQuestion: {
      reactants: [
        ['철', 14],
        ['황', 8],
      ],
      answer: '22',
      prompt: '철 14g과 황 8g이 완전히 반응해 황화철을 만들었다.',
      memoText: '보존된 총질량의 일의 자리가 첫 숫자다.',
    },
    gasOptions: [
      ['A', '질소 1L + 수소 3L → 암모니아 2L'],
      ['B', '질소 1L + 수소 2L → 암모니아 3L'],
      ['C', '질소 2L + 수소 3L → 암모니아 2L'],
    ],
    gasAnswer: 'A',
    gasMemoText: '맞는 기체 반응식에서 생성물 부피의 일의 자리가 둘째 숫자다.',
    cureMemoText: '제어반에서 선택한 계수를 마지막 숫자로 사용한다.',
    finalPassword: '222',
  },
  hard: {
    label: '도전',
    intro: '오염된 기록에서 진짜 단서를 골라 계산해야 합니다.',
    equationAnswer: 3,
    massQuestion: {
      reactants: [
        ['구리', 16],
        ['산소', 4],
      ],
      answer: '20',
      prompt:
        '복구 로그에는 “구리 16g과 산소 4g이 완전히 반응했다. 일부 연구원이 12g이라고 오기했지만 기록은 손상되었다.”라고 적혀 있다.',
      memoText: '실제 생성물 전체 질량의 십의 자리가 첫 숫자다.',
    },
    gasOptions: [
      ['A', '수소 2L + 염소 2L → 염화수소 2L'],
      ['B', '수소 1L + 염소 1L → 염화수소 2L'],
      ['C', '수소 1L + 염소 2L → 염화수소 1L'],
    ],
    gasAnswer: 'B',
    gasMemoText: '정답 보기의 생성물 부피를 읽으면 둘째 숫자가 된다.',
    cureMemoText: '반응식 패널에서 맞춘 계수의 값이 마지막 숫자다.',
    finalPassword: '123',
  },
}

const inventoryLabels = {
  LOGBOOK: '[감염 복도 기록지]',
  VALVE: '[혼합 밸브 키]',
  MASS: '[붉은 메모 조각]',
  GAS: '[푸른 메모 조각]',
  CURE: '[황금 메모 조각]',
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
  difficulty,
  finalPassword,
}) => ({
  project: 'zombie-factory-escape',
  submittedAt: new Date().toISOString(),
  student: {
    id: studentInfo.id,
    name: studentInfo.name,
  },
  playSummary: {
    cleared: true,
    difficulty,
    timeSpentSeconds: timeSpent,
    inventory,
    finalPassword,
    submissionStatus,
  },
  wrongAnswerNotes: notes,
})

function App() {
  const [step, setStep] = useState(0)
  const [studentInfo, setStudentInfo] = useState({ id: '', name: '' })
  const [difficulty, setDifficulty] = useState('normal')
  const [inventory, setInventory] = useState([])
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [shake, setShake] = useState(false)
  const [timer, setTimer] = useState(TOTAL_TIME)
  const [isGameOver, setIsGameOver] = useState(false)
  const [massAnswer, setMassAnswer] = useState('')
  const [submissionStatus, setSubmissionStatus] = useState('idle')
  const [submissionJson, setSubmissionJson] = useState('')
  const [wrongAnswerNotes, setWrongAnswerNotes] = useState([])
  const [memoKeys, setMemoKeys] = useState([])

  const previousStepRef = useRef(0)
  const timeoutRef = useRef(null)
  const { unlockSound, playByName } = useSoundEffects()

  const config = difficultyConfigs[difficulty]

  const memoFragments = {
    MASS: {
      title: '붉은 메모 조각',
      text: config.massQuestion.memoText,
    },
    GAS: {
      title: '푸른 메모 조각',
      text: config.gasMemoText,
    },
    CURE: {
      title: '황금 메모 조각',
      text: config.cureMemoText,
    },
  }

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

  const addMemo = (memoKey) => {
    setMemoKeys((current) => (current.includes(memoKey) ? current : [...current, memoKey]))
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
    }, 2400)
  }

  const moveToStep = (nextStep, itemKey) => {
    if (itemKey) {
      addInventoryItem(itemKey)
    }
    setStep(nextStep)
  }

  const handleStart = async () => {
    if (!studentInfo.id.trim() || !studentInfo.name.trim()) {
      triggerError('학번과 이름을 모두 입력해야 출입문이 해제됩니다.', '학생 정보 미입력')
      return
    }

    await unlockSound()
    moveToStep(1)
  }

  const handleEquationChoice = (choice) => {
    if (choice === config.equationAnswer) {
      addInventoryItem('VALVE')
      addMemo('CURE')
      moveToStep(3, 'LOGBOOK')
      return
    }

    triggerError(
      '제어반은 원자 수가 정확히 보존될 때만 반응합니다. 반응 전후의 H와 O 개수를 다시 맞춰 보세요.',
      `반응식 계수 답안: ${choice}`,
    )
  }

  const handleMassSubmit = () => {
    if (massAnswer.trim() === config.massQuestion.answer) {
      addMemo('MASS')
      moveToStep(4, 'MASS')
      return
    }

    triggerError(
      '질량 보존 법칙은 반응 전 전체 질량과 반응 후 전체 질량이 같다는 뜻입니다. 손상된 로그의 오기 정보에 흔들리지 마세요.',
      `질량 보존 답안: ${massAnswer || '(빈칸)'}`,
    )
  }

  const handleGasChoice = (choice) => {
    if (choice === config.gasAnswer) {
      addMemo('GAS')
      addInventoryItem('GAS')
      moveToStep(5, 'CURE')
      return
    }

    triggerError(
      '기체 반응은 간단한 정수비를 이룹니다. 각 보기에서 반응물과 생성물의 부피가 어떤 정수비를 이루는지 다시 읽어 보세요.',
      `기체 반응 선택: ${choice}`,
    )
  }

  const handleFinalUnlock = () => {
    if (password.trim() === config.finalPassword) {
      setStep(6)
      return
    }

    triggerError(
      '붉은 메모, 푸른 메모, 황금 메모의 문장을 순서대로 읽어 자리수를 조합해 보세요.',
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
      difficulty,
      finalPassword: config.finalPassword,
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
        'API 전송에는 실패했습니다. 다만 아래 JSON 결과는 그대로 확인할 수 있습니다.',
        `API 제출 실패: ${error.message}`,
      )
    }
  }

  const resetGame = () => {
    setStep(0)
    setStudentInfo({ id: '', name: '' })
    setDifficulty('normal')
    setInventory([])
    setPassword('')
    setErrorMsg('')
    setShake(false)
    setTimer(TOTAL_TIME)
    setIsGameOver(false)
    setMassAnswer('')
    setSubmissionStatus('idle')
    setSubmissionJson('')
    setWrongAnswerNotes([])
    setMemoKeys([])
  }

  const statusPanel = step > 0 && step < 6 && (
    <div className="mb-6 grid gap-3 md:grid-cols-4">
      <div className="rounded-2xl border border-emerald-400/20 bg-white/10 p-4 backdrop-blur">
        <p className="flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-emerald-100/70">
          <Timer size={16} />
          잔여 시간
        </p>
        <p className="mt-2 font-mono text-2xl font-bold text-amber-200">{formatTime(timer)}</p>
      </div>
      <div className="rounded-2xl border border-emerald-400/20 bg-white/10 p-4 backdrop-blur">
        <p className="flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-emerald-100/70">
          <ShieldAlert size={16} />
          난이도
        </p>
        <p className="mt-2 text-sm font-bold text-emerald-50">{config.label}</p>
      </div>
      <div className="rounded-2xl border border-emerald-400/20 bg-white/10 p-4 backdrop-blur">
        <p className="flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-emerald-100/70">
          <Backpack size={16} />
          회수 물품
        </p>
        <p className="mt-2 text-sm text-emerald-50">
          {inventory.length > 0 ? inventory.join(' ') : '아직 회수한 물품이 없습니다.'}
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

  const memoPanel = memoKeys.length > 0 && (
    <div className="mb-6 grid gap-3 lg:grid-cols-3">
      {memoKeys.map((key) => (
        <div
          key={key}
          className="rounded-2xl border border-amber-300/20 bg-amber-200/10 p-4 text-sm text-amber-50"
        >
          <p className="font-bold text-amber-100">{memoFragments[key].title}</p>
          <p className="mt-2 leading-6 text-amber-50/85">{memoFragments[key].text}</p>
        </div>
      ))}
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
              바이러스가 백신 공장을 장악했습니다. 봉쇄 10분 전, 마지막 실험팀인 당신이 손상된
              화학 기록을 복구해 자가백신 제조기를 재가동해야 합니다.
            </p>
          </div>
          <div className="hidden rounded-3xl border border-lime-200/15 bg-black/20 px-5 py-4 text-right shadow-reactor backdrop-blur md:block">
            <p className="text-xs uppercase tracking-[0.25em] text-emerald-100/60">Emergency Mode</p>
            <p className="mt-2 font-mono text-lg text-amber-100">Science Escape Protocol</p>
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
          {memoPanel}

          {step === 0 && (
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="animate-fade-in">
                <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-3xl border border-lime-200/20 bg-lime-300/10 text-5xl animate-drift">
                  🧟
                </div>
                <h2 className="font-display text-3xl font-black text-amber-100 md:text-5xl">
                  화학 반응식 생존 미션
                </h2>
                <p className="mt-4 max-w-xl text-base leading-7 text-emerald-50/80">
                  감염된 연구원들이 실험동을 배회하고 있습니다. 이번에는 단순한 문제풀이가 아니라
                  손상된 실험 로그, 오염된 보고서, 긴급 조작 패널을 해석해야 합니다.
                </p>
                <div className="mt-6 grid gap-3 text-sm text-emerald-50/80 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="font-bold text-amber-100">핵심 단원</p>
                    <p className="mt-2">화학 변화와 반응의 규칙</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="font-bold text-amber-100">플레이 방식</p>
                    <p className="mt-2">로그 판독 + 계산 + 암호 조합</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="font-bold text-amber-100">현재 모드</p>
                    <p className="mt-2">{config.label} / {config.intro}</p>
                  </div>
                </div>
              </div>

              <div className="animate-fade-in rounded-[1.75rem] border border-amber-200/15 bg-white/95 p-6 text-stone-900">
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-emerald-700">
                  대원 인증
                </p>
                <div className="mt-5 space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-stone-700">학번</span>
                    <input
                      className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 font-semibold outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                      placeholder="학번 입력"
                      value={studentInfo.id}
                      onChange={(event) =>
                        setStudentInfo((current) => ({ ...current, id: event.target.value }))
                      }
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-stone-700">이름</span>
                    <input
                      className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 font-semibold outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                      placeholder="이름 입력"
                      value={studentInfo.name}
                      onChange={(event) =>
                        setStudentInfo((current) => ({ ...current, name: event.target.value }))
                      }
                    />
                  </label>
                  <div>
                    <p className="mb-2 block text-sm font-semibold text-stone-700">난이도 선택</p>
                    <div className="grid gap-2 md:grid-cols-3">
                      {Object.entries(difficultyConfigs).map(([key, item]) => (
                        <button
                          key={key}
                          className={`rounded-2xl border px-3 py-3 text-sm font-bold transition ${
                            difficulty === key
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-stone-300 bg-stone-50 text-stone-700 hover:bg-stone-100'
                          }`}
                          onClick={() => setDifficulty(key)}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    className="w-full rounded-2xl bg-red-600 px-4 py-4 text-lg font-black text-white transition hover:bg-red-500 active:scale-[0.99]"
                    onClick={handleStart}
                  >
                    격리 구역 진입
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="animate-fade-in space-y-6">
              <h2 className="font-display text-3xl font-black text-amber-100">Step 1. 정전 복도</h2>
              <div className="rounded-[1.75rem] border border-blue-200/10 bg-blue-300/10 p-5 text-emerald-50">
                손전등으로 비춘 복도 기록에는 세 문장이 남아 있습니다. 이 중 화학 변화의 근거가 되는
                로그를 선택해야 다음 문이 열립니다.
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  ['A', '얼음이 녹아 바닥에 물이 고였다.', '상태 변화 기록'],
                  ['B', '양초가 타며 빛과 열이 발생하고 재가 남았다.', '연소 기록'],
                  ['C', '에탄올 냄새가 퍼지며 액체가 증발했다.', '증발 기록'],
                ].map(([key, title, description]) => (
                  <button
                    key={key}
                    className="rounded-[1.5rem] border border-white/10 bg-white/5 p-6 text-left transition hover:bg-white/10"
                    onClick={() => {
                      if (key === 'B') {
                        moveToStep(2, 'LOGBOOK')
                        return
                      }
                      triggerError(
                        '상태만 바뀐 것인지, 새로운 물질이 생긴 것인지 구분해 보세요.',
                        `복도 로그 판정: ${title}`,
                      )
                    }}
                  >
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-200/70">{key}</p>
                    <p className="mt-3 text-xl font-black text-stone-50">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-emerald-50/70">{description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in space-y-6">
              <h2 className="font-display text-3xl font-black text-amber-100">Step 2. 혼합 제어반</h2>
              <div className="rounded-[1.75rem] border border-white/10 bg-stone-900/70 p-6">
                <p className="text-sm uppercase tracking-[0.25em] text-emerald-100/65">백신수 합성 패널</p>
                <p className="mt-4 font-mono text-3xl font-bold text-emerald-50">
                  2H₂ + O₂ → aH₂O
                </p>
                <p className="mt-4 text-sm leading-7 text-emerald-50/75">
                  제어반은 원자 수가 보존되어야만 열립니다. 오염된 패널에서 계수 `a`를 맞춰 밸브 키를
                  회수하세요.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                {[1, 2, 3, 4].map((choice) => (
                  <button
                    key={choice}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-6 text-center font-mono text-3xl font-black text-lime-100 transition hover:bg-white/10"
                    onClick={() => handleEquationChoice(choice)}
                  >
                    {choice}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in space-y-6">
              <h2 className="font-display text-3xl font-black text-amber-100">Step 3. 약품 창고</h2>
              <div className="rounded-[1.75rem] border border-amber-200/10 bg-amber-300/10 p-6">
                <p className="text-sm uppercase tracking-[0.25em] text-amber-100/70">손상된 실험 보고서</p>
                <p className="mt-4 leading-8 text-emerald-50/85">
                  {config.massQuestion.prompt} 보고서 일부가 훼손되어 오기 정보가 섞여 있을 수 있습니다.
                  질량 보존 법칙을 기준으로 실제 생성물 전체 질량을 입력하세요.
                </p>
                <div className="mt-4 rounded-2xl border border-white/10 bg-stone-950/40 p-4 text-sm text-amber-50/85">
                  반응 전 기록: {config.massQuestion.reactants.map(([name, value]) => `${name} ${value}g`).join(' + ')}
                </div>
              </div>
              <div className="flex flex-col gap-4 md:flex-row">
                <input
                  className="flex-1 rounded-2xl border border-white/10 bg-stone-950/70 px-4 py-4 text-center font-mono text-2xl font-bold text-lime-100 outline-none"
                  inputMode="numeric"
                  placeholder="질량 입력"
                  value={massAnswer}
                  onChange={(event) => setMassAnswer(event.target.value.replace(/[^0-9]/g, ''))}
                />
                <button
                  className="rounded-2xl bg-amber-400 px-6 py-4 font-black text-stone-950 transition hover:bg-amber-300"
                  onClick={handleMassSubmit}
                >
                  창고 해제
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-fade-in space-y-6">
              <h2 className="font-display text-3xl font-black text-amber-100">Step 4. 환기 터널</h2>
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
                <p className="text-sm uppercase tracking-[0.25em] text-emerald-100/65">기체 반응 밸브</p>
                <p className="mt-4 leading-8 text-emerald-50/85">
                  환기 터널은 맞는 부피비를 선택한 사람만 통과시킵니다. 다음 세 밸브 기록 중 정상 로그를
                  고르세요.
                </p>
                <div className="mt-5 grid gap-3">
                  {config.gasOptions.map(([choice, label]) => (
                    <button
                      key={choice}
                      className="rounded-2xl border border-white/10 bg-stone-950/50 px-4 py-4 text-left text-emerald-50 transition hover:bg-white/10"
                      onClick={() => handleGasChoice(choice)}
                    >
                      <span className="mr-3 font-mono text-sm font-bold">{choice}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="animate-fade-in space-y-6">
              <h2 className="font-display text-3xl font-black text-amber-100">Step 5. 백신 금고</h2>
              <div className="grid gap-4 md:grid-cols-[1.05fr_0.95fr]">
                <div className="rounded-[1.75rem] border border-white/10 bg-stone-900/80 p-6">
                  <p className="flex items-center gap-2 text-sm uppercase tracking-[0.25em] text-emerald-100/65">
                    <Lock size={16} />
                    금고 해제 규칙
                  </p>
                  <p className="mt-4 text-sm leading-7 text-emerald-50/80">
                    지금까지 회수한 메모 조각 세 장이 암호를 설명합니다. 숫자를 직접 보여주지 않으므로,
                    메모의 문장을 읽고 어떤 자리수를 뽑아야 하는지 스스로 복원해야 합니다.
                  </p>
                  <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                    순서: 붉은 메모 → 푸른 메모 → 황금 메모
                  </div>
                </div>
                <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
                  <p className="text-sm font-semibold text-amber-100">금고 암호 입력</p>
                  <input
                    className="mt-4 w-full rounded-2xl border border-white/10 bg-stone-950/80 px-4 py-4 text-center font-mono text-4xl font-bold tracking-[0.35em] text-lime-100 outline-none"
                    maxLength={3}
                    value={password}
                    onChange={(event) => setPassword(event.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="세 자리 숫자"
                  />
                  <button
                    className="mt-4 w-full rounded-2xl bg-red-500 px-4 py-4 font-black text-white transition hover:bg-red-400"
                    onClick={handleFinalUnlock}
                  >
                    금고 개방
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
                  {studentInfo.name} 대원, {config.label} 난이도로 백신 금고를 열고 자가백신 제조기를
                  재가동했습니다.
                </p>
                <p className="mt-2 font-mono text-xl text-amber-100">
                  클리어 타임 {formatTime(TOTAL_TIME - timer)}
                </p>
              </div>

              <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
                  <p className="text-sm uppercase tracking-[0.25em] text-emerald-100/65">제출 패널</p>
                  <p className="mt-4 text-sm leading-7 text-emerald-50/80">
                    결과 제출을 누르면 이름, 학번, 소요 시간, 난이도, 오답 노트가 JSON으로 출력됩니다.
                    설정이 있으면 API 전송도 시도합니다.
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
                환기 시스템이 멈추고 감염 구역이 완전히 봉쇄되었습니다. 오답 노트와 메모 조각을 검토한
                뒤 다시 시도하세요.
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
            <TestTubeDiagonal size={15} />
            이번 버전은 난이도별 문제 수치와 최종 암호가 달라지고, 손상된 실험 로그를 판독하는 서사형
            문제 흐름을 사용합니다.
          </div>
        </section>
      </div>
    </main>
  )
}

export default App
