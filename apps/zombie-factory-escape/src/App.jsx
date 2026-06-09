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
    equationQuestion: {
      label: '백신수 합성 패널',
      formula: '2H₂ + O₂ → aH₂O',
      answer: 2,
      options: [1, 2, 3, 4],
      hint: '수소 원자와 산소 원자 수가 반응 전후에 같아야 합니다.',
    },
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
    gasMemoText: '수소와 산소로 만든 생성물의 부피 수를 둘째 숫자로 사용한다.',
    cureMemoText: '혼합 패널에서 맞춘 계수의 값이 마지막 숫자다.',
    finalPassword: '122',
  },
  normal: {
    label: '보통',
    intro: '숫자 계산과 단서 해석이 함께 섞입니다.',
    equationQuestion: {
      label: '암모니아 혼합 패널',
      formula: 'N₂ + 3H₂ → aNH₃',
      answer: 2,
      options: [1, 2, 3, 4],
      hint: '질소 원자 2개가 생성물에서도 같아지려면 NH₃ 분자의 개수를 맞춰야 합니다.',
    },
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
    gasMemoText: '정답 보기의 생성물 부피를 읽으면 둘째 숫자가 된다.',
    cureMemoText: '제어반에서 선택한 계수를 마지막 숫자로 사용한다.',
    finalPassword: '222',
  },
  hard: {
    label: '도전',
    intro: '오염된 기록에서 진짜 단서를 골라 계산해야 합니다.',
    equationQuestion: {
      label: '산소 방출 패널',
      formula: '2KClO₃ → 2KCl + aO₂',
      answer: 3,
      options: [1, 2, 3, 4],
      hint: '산소 원자 개수를 반응 전후에 맞추면 생성물 쪽 O₂ 개수를 정할 수 있습니다.',
    },
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
    gasMemoText: '정상 밸브 기록의 생성물 부피를 읽으면 둘째 숫자다.',
    cureMemoText: '산소 방출 패널에서 맞춘 계수의 값이 마지막 숫자다.',
    finalPassword: '223',
  },
}

const inventoryLabels = {
  LOGBOOK: '[감염 복도 기록지]',
  VALVE: '[혼합 밸브 키]',
  MASS: '[붉은 메모 조각]',
  GAS: '[푸른 메모 조각]',
  CURE: '[황금 메모 조각]',
}

const sceneLookup = {
  0: {
    key: 'intro',
    chapter: 'SCENE 00',
    location: 'B-7 중앙 격리홀',
    beat: '봉쇄 10분 전, 최종 실험팀 투입',
    transmission: '공장 전체가 적색 비상등 아래 잠겨 있다.',
  },
  1: {
    key: 'corridor',
    chapter: 'SCENE 01',
    location: '정전 복도',
    beat: '손상된 로그 3개 중 진짜 단서를 골라라',
    transmission: '천장의 비상등이 불규칙하게 꺼졌다 켜진다.',
  },
  2: {
    key: 'console',
    chapter: 'SCENE 02',
    location: '혼합 제어반',
    beat: '오염된 제어 패널에서 반응식을 복구하라',
    transmission: '금속 패널 표면 위로 차가운 푸른 빛이 흐른다.',
  },
  3: {
    key: 'storage',
    chapter: 'SCENE 03',
    location: '약품 창고',
    beat: '손상된 실험 보고서에서 실제 질량을 판별하라',
    transmission: '낡은 작업등 아래에서 종이 가장자리가 흔들린다.',
  },
  4: {
    key: 'vent',
    chapter: 'SCENE 04',
    location: '환기 터널',
    beat: '정상 밸브 기록을 골라 공기 흐름을 복원하라',
    transmission: '터널 안쪽 팬 실루엣이 천천히 회전한다.',
  },
  5: {
    key: 'vault',
    chapter: 'SCENE 05',
    location: '백신 금고',
    beat: '회수한 메모 조각으로 암호를 조합하라',
    transmission: '중앙 금고문이 낮게 진동하며 잠금 해제를 요구한다.',
  },
  6: {
    key: 'clear',
    chapter: 'SCENE CLEAR',
    location: '자가백신 제조기',
    beat: '백신 제조기 재가동 성공',
    transmission: '차갑던 실험동에 초록색 가동등이 다시 켜진다.',
  },
  '-1': {
    key: 'overrun',
    chapter: 'SCENE LOST',
    location: '봉쇄 완료',
    beat: '격리 구역이 완전히 닫혔다',
    transmission: '셔터가 내려오며 마지막 경고음이 울린다.',
  },
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
  const [transitioning, setTransitioning] = useState(false)

  const initializedRef = useRef(false)
  const timeoutRef = useRef(null)
  const transitionTimeoutRef = useRef(null)
  const { unlockSound, playByName } = useSoundEffects()

  const config = difficultyConfigs[difficulty]
  const scene = sceneLookup[String(step)] ?? sceneLookup[0]

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
    if (!initializedRef.current) {
      initializedRef.current = true
      return
    }

    const soundName = step === 6 ? 'success' : step === -1 ? 'error' : 'step'
    playByName(soundName)
    setTransitioning(true)

    if (transitionTimeoutRef.current) {
      window.clearTimeout(transitionTimeoutRef.current)
    }

    transitionTimeoutRef.current = window.setTimeout(() => {
      setTransitioning(false)
    }, 420)
  }, [playByName, step])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
      if (transitionTimeoutRef.current) {
        window.clearTimeout(transitionTimeoutRef.current)
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
    if (choice === config.equationQuestion.answer) {
      addInventoryItem('VALVE')
      addMemo('CURE')
      moveToStep(3, 'LOGBOOK')
      return
    }

    triggerError(
      config.equationQuestion.hint,
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
      <div className="hud-card">
        <p className="hud-card__label">
          <Timer size={15} />
          Sealing Timer
        </p>
        <p className="hud-card__value">{formatTime(timer)}</p>
      </div>
      <div className="hud-card">
        <p className="hud-card__label">
          <ShieldAlert size={15} />
          Difficulty
        </p>
        <p className="hud-card__value hud-card__value--small">{config.label}</p>
      </div>
      <div className="hud-card">
        <p className="hud-card__label">
          <Backpack size={15} />
          Recovered Items
        </p>
        <p className="hud-card__value hud-card__value--small">
          {inventory.length > 0 ? inventory.join(' ') : '없음'}
        </p>
      </div>
      <div className="hud-card">
        <p className="hud-card__label">
          <Archive size={15} />
          Wrong Notes
        </p>
        <p className="hud-card__value">{wrongAnswerNotes.length}</p>
      </div>
    </div>
  )

  const memoPanel = memoKeys.length > 0 && (
    <div className="mb-6 grid gap-3 lg:grid-cols-3">
      {memoKeys.map((key) => (
        <div key={key} className="memo-card">
          <p className="memo-card__title">{memoFragments[key].title}</p>
          <p className="memo-card__body">{memoFragments[key].text}</p>
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
            className={`checkpoint-chip ${
              active ? 'checkpoint-chip--active' : completed ? 'checkpoint-chip--done' : ''
            }`}
          >
            {quest.label}
          </div>
        )
      })}
    </div>
  )

  return (
    <main className={`scene-shell scene-${scene.key} relative min-h-screen overflow-hidden px-4 py-8 text-stone-50 md:px-6`}>
      <div className="scene-ambient scene-ambient--a" />
      <div className="scene-ambient scene-ambient--b" />
      <div className="scene-ambient scene-ambient--c" />
      <div className="scene-grid" />

      {transitioning && (
        <div className="cinema-cut">
          <div className="cinema-cut__label">{scene.chapter}</div>
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-6xl">
        <header className="mb-8 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="scene-badge">
              <Siren size={14} />
              Zombie Factory Alert
            </p>
            <h1 className="font-display text-4xl font-black tracking-tight text-lime-100 md:text-7xl">
              좀비 공장
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-emerald-50/80 md:text-base">
              바이러스가 백신 공장을 장악했습니다. 이번 버전은 장면별로 다른 광원과 기록 장치를
              통과하며, 플레이어가 실제 시설 안을 이동하는 느낌으로 설계되어 있습니다.
            </p>
          </div>

          <aside className="camera-feed">
            <div className="camera-feed__screen">
              <p className="camera-feed__chapter">{scene.chapter}</p>
              <h2 className="camera-feed__location">{scene.location}</h2>
              <p className="camera-feed__beat">{scene.beat}</p>
              <div className="camera-feed__ticker">
                <span>Transmission</span>
                <span>{scene.transmission}</span>
              </div>
            </div>
          </aside>
        </header>

        <section className={`scene-panel ${shake ? 'animate-shake' : ''}`}>
          <div className="story-ticker">
            <span>{scene.location}</span>
            <span>{scene.beat}</span>
            <span>{scene.transmission}</span>
          </div>

          {step > 0 && step !== 6 && step !== -1 && questRail}
          {statusPanel}
          {memoPanel}

          {step === 0 && (
            <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
              <div className="animate-fade-in">
                <div className="hero-emblem">🧪</div>
                <h2 className="font-display text-3xl font-black text-amber-100 md:text-5xl">
                  화학 반응식 생존 미션
                </h2>
                <p className="scene-note mt-5">
                  오염 복도에서는 기록을 판독하고, 제어실에서는 반응식을 복구하고, 창고에서는 손상된
                  보고서에서 진짜 숫자를 골라야 합니다. 마지막 금고 암호는 메모 조각을 읽어 스스로
                  조합해야 합니다.
                </p>
                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  <div className="info-tile">
                    <p className="info-tile__label">핵심 단원</p>
                    <p className="info-tile__value">화학 변화와 반응의 규칙</p>
                  </div>
                  <div className="info-tile">
                    <p className="info-tile__label">플레이 방식</p>
                    <p className="info-tile__value">장면형 문제 + 암호 복원</p>
                  </div>
                  <div className="info-tile">
                    <p className="info-tile__label">활성 모드</p>
                    <p className="info-tile__value">
                      {config.label} / {config.intro}
                    </p>
                  </div>
                </div>
              </div>

              <div className="access-console animate-fade-in">
                <p className="access-console__title">대원 인증</p>
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
                          className={`difficulty-toggle ${difficulty === key ? 'difficulty-toggle--active' : ''}`}
                          onClick={() => setDifficulty(key)}
                        >
                          <span>{item.label}</span>
                          <small>{item.intro}</small>
                        </button>
                      ))}
                    </div>
                  </div>
                  <button className="launch-button" onClick={handleStart}>
                    격리 구역 진입
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="animate-fade-in space-y-6">
              <div className="scene-headline">
                <h2 className="font-display text-3xl font-black text-amber-100">Step 1. 정전 복도</h2>
                <p className="scene-note">
                  손전등이 켜질 때마다 벽에 붙은 로그 세 장이 번갈아 드러납니다. 새로운 물질이 생긴
                  기록을 골라야 다음 구역으로 이동할 수 있습니다.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  ['LOG-17', '얼음이 녹아 바닥에 물이 고였다.', '상태 변화 기록', 'A'],
                  ['LOG-23', '양초가 타며 빛과 열이 발생하고 재가 남았다.', '연소 기록', 'B'],
                  ['LOG-31', '에탄올 냄새가 퍼지며 액체가 증발했다.', '증발 기록', 'C'],
                ].map(([code, title, description, key]) => (
                  <button
                    key={code}
                    className="log-card"
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
                    <p className="log-card__code">{code}</p>
                    <p className="log-card__title">{title}</p>
                    <p className="log-card__body">{description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in space-y-6">
              <div className="scene-headline">
                <h2 className="font-display text-3xl font-black text-amber-100">Step 2. 혼합 제어반</h2>
                <p className="scene-note">
                  오염된 패널이 계수 하나만 보여 줍니다. 반응 전후 원자 수를 복구해 밸브 키를 회수하세요.
                </p>
              </div>
              <div className="control-panel">
                <p className="control-panel__label">{config.equationQuestion.label}</p>
                <p className="control-panel__formula">{config.equationQuestion.formula}</p>
                <p className="control-panel__caption">
                  반응 전후 원자 수가 같아질 때만 보안 패널이 녹색으로 전환됩니다.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                {config.equationQuestion.options.map((choice) => (
                  <button
                    key={choice}
                    className="control-dial"
                    onClick={() => handleEquationChoice(choice)}
                  >
                    <span className="control-dial__index">SEL</span>
                    <span className="control-dial__value">{choice}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in space-y-6">
              <div className="scene-headline">
                <h2 className="font-display text-3xl font-black text-amber-100">Step 3. 약품 창고</h2>
                <p className="scene-note">
                  작업등 아래에서 종이 일부가 타 버린 보고서를 복구해야 합니다. 반응 전 질량의 총합을
                  기준으로 진짜 결과를 골라내세요.
                </p>
              </div>
              <div className="report-sheet">
                <p className="report-sheet__label">손상된 실험 보고서</p>
                <p className="report-sheet__body">{config.massQuestion.prompt}</p>
                <div className="report-sheet__row">
                  반응 전 기록:
                  <span>
                    {config.massQuestion.reactants
                      .map(([name, value]) => `${name} ${value}g`)
                      .join(' + ')}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-4 md:flex-row">
                <input
                  className="report-input"
                  inputMode="numeric"
                  placeholder="실제 생성물 질량 입력"
                  value={massAnswer}
                  onChange={(event) => setMassAnswer(event.target.value.replace(/[^0-9]/g, ''))}
                />
                <button className="action-button action-button--amber" onClick={handleMassSubmit}>
                  보고서 복구
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-fade-in space-y-6">
              <div className="scene-headline">
                <h2 className="font-display text-3xl font-black text-amber-100">Step 4. 환기 터널</h2>
                <p className="scene-note">
                  세 개의 밸브 기록 중 하나만 정상 압력을 가리킵니다. 올바른 기체 부피비를 찾아 터널을
                  다시 돌리세요.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {config.gasOptions.map(([choice, label]) => (
                  <button
                    key={choice}
                    className="valve-card"
                    onClick={() => handleGasChoice(choice)}
                  >
                    <p className="valve-card__code">VALVE {choice}</p>
                    <p className="valve-card__title">{label}</p>
                    <p className="valve-card__body">정상 부피비 기록인지 검증 후 개방</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="animate-fade-in space-y-6">
              <div className="scene-headline">
                <h2 className="font-display text-3xl font-black text-amber-100">Step 5. 백신 금고</h2>
                <p className="scene-note">
                  숫자는 직접 주어지지 않습니다. 회수한 메모 조각 세 장을 읽고 자리수를 조합해 금고를
                  열어야 합니다.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-[1.05fr_0.95fr]">
                <div className="vault-shell">
                  <p className="vault-shell__label">금고 해제 규칙</p>
                  <p className="vault-shell__body">
                    붉은 메모, 푸른 메모, 황금 메모를 순서대로 읽어 자리수를 조합하세요. 이 금고는
                    계산 결과가 아니라 문장을 해석하는 사람에게만 열립니다.
                  </p>
                  <div className="vault-shell__hint">순서: 붉은 메모 → 푸른 메모 → 황금 메모</div>
                </div>
                <div className="vault-console">
                  <p className="vault-console__label">금고 암호 입력</p>
                  <input
                    className="vault-console__input"
                    maxLength={3}
                    value={password}
                    onChange={(event) => setPassword(event.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="세 자리 숫자"
                  />
                  <button className="action-button action-button--red" onClick={handleFinalUnlock}>
                    금고 개방
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="animate-fade-in space-y-6">
              <div className="success-panel">
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
                <div className="result-panel">
                  <p className="result-panel__label">제출 패널</p>
                  <p className="result-panel__body">
                    결과 제출을 누르면 이름, 학번, 소요 시간, 난이도, 오답 노트가 JSON으로 출력됩니다.
                    설정이 있으면 API 전송도 시도합니다.
                  </p>
                  <div className="mt-5 flex flex-col gap-3">
                    <button className="action-button action-button--green" onClick={handleSubmitResult}>
                      <Send size={18} />
                      결과 제출
                    </button>
                    <button className="action-button action-button--ghost" onClick={resetGame}>
                      다시 시작
                    </button>
                  </div>
                  <p className="mt-4 text-xs text-emerald-100/60">제출 상태: {submissionStatus}</p>
                </div>

                <div className="json-panel">
                  <p className="result-panel__label">Result JSON</p>
                  <pre className="json-panel__pre">{submissionJson || '아직 제출 전입니다.'}</pre>
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
              <button className="action-button action-button--red mx-auto" onClick={resetGame}>
                다시 도전
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="error-toast">
              <p className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </p>
            </div>
          )}

          <div className="footer-note">
            <TestTubeDiagonal size={15} />
            이 버전은 장면별 광원, HUD, 로그 카드, 제어 패널, 실험 보고서, 금고 인터페이스를 분리해서
            영화적인 전개를 강조합니다.
          </div>
        </section>
      </div>
    </main>
  )
}

export default App
