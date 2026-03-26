import React from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { getLessonById, getLessons, getLevels, getSubjects, getUnits, saveProgress } from './services/api';

const getSubjectIcon = (iconId) => {
    const iconMap = {
        math: '📐',
        science: '🌿',
        language: '📖',
        english: '🔤',
        history: '🏛️',
        geo: '🌍',
        art: '🎨'
    };

    return iconMap[iconId] || '📚';
};

function ErrorFallback({
    title = 'Algo salio mal',
    message = 'No pudimos cargar esta seccion en este momento.'
}) {
    return (
        <div
            style={{
                minHeight: '60vh',
                display: 'grid',
                placeItems: 'center',
                padding: '1.5rem'
            }}
        >
            <div
                style={{
                    width: '100%',
                    maxWidth: '520px',
                    background: '#ffffff',
                    border: '2px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '1.2rem',
                    boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)',
                    textAlign: 'center'
                }}
            >
                <h2 style={{ margin: 0, color: '#0f172a' }}>{title}</h2>
                <p style={{ color: '#475569' }}>{message}</p>
                <button
                    type="button"
                    onClick={() => window.location.reload()}
                    style={{
                        border: 'none',
                        background: '#1d4ed8',
                        color: '#ffffff',
                        borderRadius: '10px',
                        padding: '0.55rem 0.9rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                    }}
                >
                    🔄 Reintentar
                </button>
            </div>
        </div>
    );
}

function RouteContainer({ children }) {
    const [visible, setVisible] = React.useState(false);

    React.useEffect(() => {
        const frameId = window.requestAnimationFrame(() => setVisible(true));
        return () => window.cancelAnimationFrame(frameId);
    }, []);

    return (
        <div
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(6px)',
                transition: 'opacity 0.35s ease, transform 0.35s ease'
            }}
        >
            {children}
        </div>
    );
}

function SubjectsPage() {
    const [subjects, setSubjects] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [loadError, setLoadError] = React.useState(false);

    React.useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const data = await getSubjects();
                if (mounted) {
                    setSubjects(Array.isArray(data) ? data : []);
                    setLoadError(false);
                }
            } catch (error) {
                if (mounted) {
                    setSubjects([]);
                    setLoadError(true);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            mounted = false;
        };
    }, []);

    if (loading) {
        return (
            <div style={{ padding: '2rem', fontSize: '1.1rem' }}>
                Cargando materias...
            </div>
        );
    }

    if (loadError) {
        return (
            <ErrorFallback
                title="No pudimos cargar las materias"
                message="Verifica tu conexion o el estado del servidor e intentalo de nuevo."
            />
        );
    }

    return (
        <RouteContainer>
            <div
                style={{
                    minHeight: '100vh',
                    padding: '2rem',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)'
                }}
            >
            <header style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ margin: 0, fontSize: '2rem' }}>Selector de Materias</h1>
                <p style={{ margin: '0.5rem 0 0', color: '#475569' }}>
                    Elige una materia para comenzar tu recorrido de aprendizaje.
                </p>
            </header>

            <section
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                    gap: '1rem'
                }}
            >
                {subjects.map((subject) => {
                    const primaryColor = subject?.uiConfig?.primaryColor || '#334155';
                    const secondaryColor = subject?.uiConfig?.secondaryColor || '#f1f5f9';
                    const icon = getSubjectIcon(subject?.uiConfig?.iconId);

                    return (
                        <Link
                            key={subject._id}
                            to={`/materias/${subject.slug}`}
                            style={{
                                background: secondaryColor,
                                border: `2px solid ${primaryColor}`,
                                color: primaryColor,
                                borderRadius: '16px',
                                padding: '1rem',
                                textDecoration: 'none',
                                boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                            }}
                        >
                            <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{icon}</div>
                            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{subject.name}</h2>
                            <p style={{ margin: '0.5rem 0 0', opacity: 0.85 }}>
                                Explorar niveles
                            </p>
                        </Link>
                    );
                })}
            </section>
            </div>
        </RouteContainer>
    );
}

function LevelsPage() {
    const { subjectSlug } = useParams();
    const [subject, setSubject] = React.useState(null);
    const [levels, setLevels] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [notFound, setNotFound] = React.useState(false);
    const [loadError, setLoadError] = React.useState(false);

    React.useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const subjects = await getSubjects();
                const selectedSubject = (subjects || []).find((s) => s.slug === subjectSlug);

                if (!selectedSubject) {
                    if (mounted) {
                        setNotFound(true);
                    }
                    return;
                }

                if (mounted) {
                    setSubject(selectedSubject);
                    setNotFound(false);
                    setLoadError(false);
                }

                const data = await getLevels(selectedSubject._id);
                if (mounted) {
                    setLevels(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                if (mounted) {
                    setLevels([]);
                    setLoadError(true);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            mounted = false;
        };
    }, [subjectSlug]);

    if (loading) return <div>Cargando niveles...</div>;
    if (notFound) return <Navigate to="/" replace />;
    if (loadError) {
        return (
            <ErrorFallback
                title="No pudimos cargar los niveles"
                message="Intenta nuevamente en unos segundos."
            />
        );
    }

    const primaryColor = subject?.uiConfig?.primaryColor || '#334155';
    const secondaryColor = subject?.uiConfig?.secondaryColor || '#f1f5f9';
    const icon = getSubjectIcon(subject?.uiConfig?.iconId);

    return (
        <RouteContainer>
            <div style={{ minHeight: '100vh', padding: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
                <Link
                    to="/"
                    style={{
                        display: 'inline-block',
                        textDecoration: 'none',
                        color: '#334155',
                        fontWeight: 600
                    }}
                >
                    ⬅️ Volver a Materias
                </Link>
            </div>

            <header
                style={{
                    background: secondaryColor,
                    border: `2px solid ${primaryColor}`,
                    borderRadius: '18px',
                    padding: '1.25rem',
                    marginBottom: '1rem'
                }}
            >
                <div style={{ fontSize: '1.9rem' }}>{icon}</div>
                <h1 style={{ margin: '0.4rem 0 0', color: primaryColor }}>
                    {subject?.name || 'Niveles'}
                </h1>
                <p style={{ margin: '0.35rem 0 0', color: '#475569' }}>
                    Selecciona el grado para ver sus unidades.
                </p>
            </header>

            <section
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                    gap: '1rem'
                }}
            >
                {levels.map((level) => (
                    <Link
                        key={level._id}
                        to={`/niveles/${level._id}`}
                        style={{
                            textDecoration: 'none',
                            background: '#ffffff',
                            border: `2px solid ${primaryColor}`,
                            borderRadius: '16px',
                            padding: '1rem',
                            boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)'
                        }}
                    >
                        <div
                            style={{
                                display: 'inline-block',
                                background: primaryColor,
                                color: '#ffffff',
                                borderRadius: '999px',
                                padding: '0.25rem 0.7rem',
                                fontSize: '0.8rem',
                                marginBottom: '0.6rem'
                            }}
                        >
                            Nivel {level.order}
                        </div>
                        <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem' }}>
                            {level.name}
                        </h2>
                    </Link>
                ))}
            </section>
            {levels.length === 0 ? (
                <p style={{ marginTop: '1rem', color: '#475569', fontWeight: 600 }}>
                    ✨ ¡Pronto habra contenido aqui! Vuelve mas tarde.
                </p>
            ) : null}
            </div>
        </RouteContainer>
    );
}

function UnitsPage() {
    const { levelSlug } = useParams();
    const [subject, setSubject] = React.useState(null);
    const [level, setLevel] = React.useState(null);
    const [units, setUnits] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [notFound, setNotFound] = React.useState(false);
    const [loadError, setLoadError] = React.useState(false);

    React.useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const subjects = await getSubjects();
                let foundSubject = null;
                let foundLevel = null;

                for (const currentSubject of subjects || []) {
                    const levelsBySubject = await getLevels(currentSubject._id);
                    const match = (levelsBySubject || []).find(
                        (currentLevel) => String(currentLevel._id) === String(levelSlug)
                    );

                    if (match) {
                        foundSubject = currentSubject;
                        foundLevel = match;
                        break;
                    }
                }

                if (!foundSubject || !foundLevel) {
                    if (mounted) {
                        setNotFound(true);
                    }
                    return;
                }

                if (mounted) {
                    setSubject(foundSubject);
                    setLevel(foundLevel);
                    setNotFound(false);
                    setLoadError(false);
                }

                const data = await getUnits(levelSlug);
                if (mounted) {
                    setUnits(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                if (mounted) {
                    setUnits([]);
                    setLoadError(true);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            mounted = false;
        };
    }, [levelSlug]);

    if (loading) return <div>Cargando unidades...</div>;
    if (notFound) return <Navigate to="/" replace />;
    if (loadError) {
        return (
            <ErrorFallback
                title="No pudimos cargar las unidades"
                message="Parece un problema temporal. Intenta de nuevo."
            />
        );
    }

    const primaryColor = subject?.uiConfig?.primaryColor || '#334155';
    const secondaryColor = subject?.uiConfig?.secondaryColor || '#f1f5f9';
    const icon = getSubjectIcon(subject?.uiConfig?.iconId);

    return (
        <RouteContainer>
            <div style={{ minHeight: '100vh', padding: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
                <Link
                    to={`/materias/${subject?.slug}`}
                    style={{
                        display: 'inline-block',
                        textDecoration: 'none',
                        color: '#334155',
                        fontWeight: 600
                    }}
                >
                    ⬅️ Volver a Niveles
                </Link>
            </div>

            <header
                style={{
                    background: secondaryColor,
                    border: `2px solid ${primaryColor}`,
                    borderRadius: '18px',
                    padding: '1.25rem',
                    marginBottom: '1rem'
                }}
            >
                <div style={{ fontSize: '1.9rem' }}>{icon}</div>
                <h1 style={{ margin: '0.4rem 0 0', color: primaryColor }}>
                    {subject?.name} {'>'} {level?.name}
                </h1>
                <p style={{ margin: '0.35rem 0 0', color: '#475569' }}>
                    Elige una unidad para entrar a sus lecciones.
                </p>
            </header>

            <section style={{ display: 'grid', gap: '0.8rem' }}>
                {units.map((unit) => (
                    <Link
                        key={unit._id}
                        to={`/unidades/${unit._id}/lecciones`}
                        style={{
                            textDecoration: 'none',
                            background: '#ffffff',
                            border: `2px solid ${primaryColor}`,
                            borderRadius: '14px',
                            padding: '1rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)'
                        }}
                    >
                        <div>
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: '0.8rem',
                                    color: '#64748b',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em'
                                }}
                            >
                                Modulo {unit.order}
                            </p>
                            <h2 style={{ margin: '0.25rem 0 0', color: '#0f172a', fontSize: '1.15rem' }}>
                                {unit.title}
                            </h2>
                        </div>
                        <span style={{ color: primaryColor, fontWeight: 700 }}>Entrar</span>
                    </Link>
                ))}
            </section>
            </div>
        </RouteContainer>
    );
}

const getLessonTypeIcon = (type) => {
    const typeMap = {
        theory: '📖',
        practice: '✍️',
        quiz: '🧠',
        game: '🎮'
    };

    return typeMap[type] || '📘';
};

function LessonsPage() {
    const { unitId } = useParams();
    const [subject, setSubject] = React.useState(null);
    const [level, setLevel] = React.useState(null);
    const [unit, setUnit] = React.useState(null);
    const [lessons, setLessons] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [notFound, setNotFound] = React.useState(false);
    const [loadError, setLoadError] = React.useState(false);

    React.useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const subjects = await getSubjects();
                let foundSubject = null;
                let foundLevel = null;
                let foundUnit = null;

                for (const currentSubject of subjects || []) {
                    const levelsBySubject = await getLevels(currentSubject._id);

                    for (const currentLevel of levelsBySubject || []) {
                        const unitsByLevel = await getUnits(currentLevel._id);
                        const match = (unitsByLevel || []).find(
                            (currentUnit) => String(currentUnit._id) === String(unitId)
                        );

                        if (match) {
                            foundSubject = currentSubject;
                            foundLevel = currentLevel;
                            foundUnit = match;
                            break;
                        }
                    }

                    if (foundUnit) {
                        break;
                    }
                }

                if (!foundSubject || !foundLevel || !foundUnit) {
                    if (mounted) {
                        setNotFound(true);
                    }
                    return;
                }

                if (mounted) {
                    setSubject(foundSubject);
                    setLevel(foundLevel);
                    setUnit(foundUnit);
                    setNotFound(false);
                    setLoadError(false);
                }

                const lessonsData = await getLessons(unitId);
                if (mounted) {
                    setLessons(Array.isArray(lessonsData) ? lessonsData : []);
                }
            } catch (error) {
                if (mounted) {
                    setLessons([]);
                    setLoadError(true);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            mounted = false;
        };
    }, [unitId]);

    if (loading) return <div>Cargando lecciones...</div>;
    if (notFound) return <Navigate to="/" replace />;
    if (loadError) {
        return (
            <ErrorFallback
                title="No pudimos cargar las lecciones"
                message="Verifica tu conexion e intenta nuevamente."
            />
        );
    }

    const primaryColor = subject?.uiConfig?.primaryColor || '#334155';
    const secondaryColor = subject?.uiConfig?.secondaryColor || '#f1f5f9';
    const subjectIcon = getSubjectIcon(subject?.uiConfig?.iconId);

    return (
        <RouteContainer>
            <div style={{ minHeight: '100vh', padding: '1.5rem' }}>
            <Link
                to={`/niveles/${level?._id}`}
                style={{
                    display: 'inline-block',
                    textDecoration: 'none',
                    color: '#334155',
                    fontWeight: 600,
                    marginBottom: '1rem'
                }}
            >
                ⬅️ Volver a la Unidad
            </Link>

            <header
                style={{
                    background: secondaryColor,
                    border: `2px solid ${primaryColor}`,
                    borderRadius: '18px',
                    padding: '1.25rem',
                    marginBottom: '1rem'
                }}
            >
                <div style={{ fontSize: '1.9rem' }}>{subjectIcon}</div>
                <h1 style={{ margin: '0.4rem 0 0', color: primaryColor }}>
                    {subject?.name} {'>'} {unit?.title}
                </h1>
                <p style={{ margin: '0.35rem 0 0', color: '#475569' }}>
                    {level?.name} · Elige una actividad para comenzar.
                </p>
            </header>

            <section style={{ display: 'grid', gap: '0.8rem' }}>
                {lessons.map((lesson) => (
                    <article
                        key={lesson._id}
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#ffffff',
                            border: `2px solid ${primaryColor}`,
                            borderRadius: '14px',
                            padding: '0.95rem 1rem',
                            boxShadow: '0 8px 20px rgba(15, 23, 42, 0.08)'
                        }}
                    >
                        <div>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
                                {getLessonTypeIcon(lesson.type)} {lesson.type}
                            </p>
                            <h2 style={{ margin: '0.25rem 0 0', color: '#0f172a', fontSize: '1.1rem' }}>
                                {lesson.title}
                            </h2>
                        </div>

                        <Link
                            to={`/leccion/${lesson._id}`}
                            style={{
                                textDecoration: 'none',
                                background: primaryColor,
                                color: '#ffffff',
                                borderRadius: '10px',
                                padding: '0.45rem 0.8rem',
                                fontWeight: 700
                            }}
                        >
                            Empezar
                        </Link>
                    </article>
                ))}
            </section>
            {lessons.length === 0 ? (
                <p style={{ marginTop: '1rem', color: '#475569', fontWeight: 600 }}>
                    ✨ ¡Pronto habra contenido aqui! Vuelve mas tarde.
                </p>
            ) : null}
            </div>
        </RouteContainer>
    );
}

const TEST_USER_ID = '69c471d05297812f2f92289e';

function MathTableGenerator({ content, lessonId, onComplete, onReset, primaryColor }) {
    const parsedTable = Number(
        content?.table ||
        content?.tabla ||
        content?.number ||
        content?.multiplier ||
        content?.value ||
        2
    );
    const tableValue = Number.isFinite(parsedTable) && parsedTable > 0 ? parsedTable : 2;
    const [answers, setAnswers] = React.useState({});
    const [isCompleted, setIsCompleted] = React.useState(false);
    const [confettiFrame, setConfettiFrame] = React.useState(0);
    const storageKey = `progress_lesson_${lessonId}`;

    const correctCount = Array.from({ length: 10 }, (_, index) => {
        const factor = index + 1;
        const currentValue = Number(answers[factor]);
        return currentValue === tableValue * factor ? 1 : 0;
    }).reduce((total, current) => total + current, 0);
    const progressPercent = Math.round((correctCount / 10) * 100);

    const getMotivationalMessage = () => {
        if (correctCount === 10) return '¡ERES UN GENIO! 🏆';
        if (correctCount >= 7) return '¡Casi lo tienes!';
        if (correctCount >= 4) return '¡Vas por la mitad!';
        if (correctCount >= 1) return '¡Buen comienzo!';
        return 'Empieza con la primera multiplicacion.';
    };

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedRaw = window.localStorage.getItem(storageKey);
            if (savedRaw) {
                try {
                    const parsed = JSON.parse(savedRaw);
                    setAnswers(parsed && typeof parsed === 'object' ? parsed : {});
                } catch (error) {
                    setAnswers({});
                }
            } else {
                setAnswers({});
            }
        } else {
            setAnswers({});
        }
        setIsCompleted(false);
    }, [storageKey, tableValue]);

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(storageKey, JSON.stringify(answers));
        }
    }, [answers, storageKey]);

    React.useEffect(() => {
        if (!isCompleted) {
            return undefined;
        }

        const intervalId = setInterval(() => {
            setConfettiFrame((prev) => (prev + 1) % 2);
        }, 300);

        return () => clearInterval(intervalId);
    }, [isCompleted]);

    React.useEffect(() => {
        const allCorrect = Array.from({ length: 10 }, (_, index) => {
            const factor = index + 1;
            const currentValue = Number(answers[factor]);
            return currentValue === tableValue * factor;
        }).every(Boolean);

        if (allCorrect && !isCompleted) {
            setIsCompleted(true);
            onComplete();
        }
    }, [answers, isCompleted, onComplete, tableValue]);

    const getInputStyle = (factor) => {
        const rawValue = answers[factor];
        if (rawValue === undefined || rawValue === '') {
            return {
                border: `2px solid ${primaryColor}`,
                background: '#ffffff',
                color: '#0f172a'
            };
        }

        const numericValue = Number(rawValue);
        const isCorrect = numericValue === tableValue * factor;

        return {
            border: `2px solid ${isCorrect ? '#16a34a' : '#dc2626'}`,
            background: isCorrect ? '#dcfce7' : '#fee2e2',
            color: isCorrect ? '#166534' : '#991b1b'
        };
    };

    const handleChange = (factor, value) => {
        if (value !== '' && !/^\d+$/.test(value)) {
            return;
        }

        setAnswers((prev) => ({
            ...prev,
            [factor]: value
        }));

        if (isCompleted) {
            setIsCompleted(false);
            onReset();
        }
    };

    const handleClearAll = () => {
        if (typeof window === 'undefined') {
            return;
        }

        const confirmed = window.confirm('¿Deseas borrar todas tus respuestas y empezar de cero?');
        if (!confirmed) {
            return;
        }

        window.localStorage.removeItem(storageKey);
        setAnswers({});
        setIsCompleted(false);
        onReset();
    };

    return (
        <div
            style={{
                borderRadius: '14px',
                padding: '0.9rem',
                background: isCompleted
                    ? confettiFrame === 0
                        ? 'linear-gradient(135deg, #fff8cc 0%, #fde68a 100%)'
                        : 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)'
                    : '#ffffff',
                border: isCompleted ? '2px solid #f59e0b' : `2px solid ${primaryColor}`,
                transition: 'background 0.3s ease, border-color 0.3s ease'
            }}
        >
            <p style={{ marginTop: 0, color: '#1f2937' }}>
                🧮 Generador de Tablas Activo para la tabla del [{tableValue}]
            </p>
            <div style={{ marginBottom: '0.75rem' }}>
                <div
                    style={{
                        height: '10px',
                        width: '100%',
                        background: '#e2e8f0',
                        borderRadius: '999px',
                        overflow: 'hidden',
                        border: `1px solid ${primaryColor}`
                    }}
                >
                    <div
                        style={{
                            height: '100%',
                            width: `${progressPercent}%`,
                            background: primaryColor,
                            transition: 'width 0.3s ease'
                        }}
                    />
                </div>
                <p style={{ margin: '0.45rem 0 0', color: primaryColor, fontWeight: 700 }}>
                    Progreso: {progressPercent}% · {getMotivationalMessage()}
                </p>
            </div>
            <div
                style={{
                    display: 'grid',
                    gap: '0.6rem',
                    maxWidth: '480px'
                }}
            >
                {Array.from({ length: 10 }, (_, index) => {
                    const factor = index + 1;
                    return (
                        <label
                            key={factor}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 120px',
                                gap: '0.7rem',
                                alignItems: 'center'
                            }}
                        >
                            <span style={{ color: '#0f172a', fontWeight: 600 }}>
                                {tableValue} x {factor} =
                            </span>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={answers[factor] ?? ''}
                                onChange={(event) => handleChange(factor, event.target.value)}
                                style={{
                                    width: '100%',
                                    borderRadius: '10px',
                                    padding: '0.45rem 0.6rem',
                                    outline: 'none',
                                    fontWeight: 700,
                                    ...getInputStyle(factor)
                                }}
                            />
                        </label>
                    );
                })}
            </div>
            <div style={{ marginTop: '0.75rem' }}>
                <button
                    type="button"
                    onClick={handleClearAll}
                    style={{
                        border: `2px solid ${primaryColor}`,
                        background: '#ffffff',
                        color: primaryColor,
                        borderRadius: '10px',
                        padding: '0.45rem 0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                    }}
                >
                    Reiniciar Tabla
                </button>
            </div>
            {isCompleted ? (
                <p style={{ margin: '0.75rem 0 0', color: '#15803d', fontWeight: 700 }}>
                    {confettiFrame === 0 ? '🎉✨🎉' : '✨🎉✨'} ¡Tabla completada! Ya puedes finalizar la lección.
                </p>
            ) : null}
        </div>
    );
}

function LessonDetailView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [lesson, setLesson] = React.useState(null);
    const [subject, setSubject] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [notFound, setNotFound] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [saveSuccess, setSaveSuccess] = React.useState(false);
    const [practiceCompleted, setPracticeCompleted] = React.useState(false);
    const [loadError, setLoadError] = React.useState(false);

    React.useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const lessonData = await getLessonById(id);

                if (!lessonData || !lessonData.unitId) {
                    if (mounted) {
                        setNotFound(true);
                    }
                    return;
                }

                if (mounted) {
                    setLesson(lessonData);
                    setLoadError(false);
                }

                const subjects = await getSubjects();
                let foundSubject = null;

                for (const currentSubject of subjects || []) {
                    const levelsBySubject = await getLevels(currentSubject._id);

                    for (const currentLevel of levelsBySubject || []) {
                        const unitsByLevel = await getUnits(currentLevel._id);
                        const match = (unitsByLevel || []).find(
                            (currentUnit) => String(currentUnit._id) === String(lessonData.unitId)
                        );

                        if (match) {
                            foundSubject = currentSubject;
                            break;
                        }
                    }

                    if (foundSubject) {
                        break;
                    }
                }

                if (mounted) {
                    setSubject(foundSubject);
                }
            } catch (error) {
                if (mounted) {
                    setLoadError(true);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            mounted = false;
        };
    }, [id]);

    React.useEffect(() => {
        setPracticeCompleted(false);
    }, [id]);

    const handleFinishLesson = async () => {
        if (!lesson?._id) return;

        try {
            setSaving(true);
            await saveProgress({
                userId: TEST_USER_ID,
                lessonId: lesson._id,
                score: 100
            });

            if (typeof window !== 'undefined') {
                window.localStorage.removeItem(`progress_lesson_${lesson._id}`);
            }

            setSaveSuccess(true);

            setTimeout(() => {
                navigate(`/unidades/${lesson.unitId}/lecciones`);
            }, 900);
        } catch (error) {
            console.error('No se pudo guardar el progreso:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Cargando leccion...</div>;
    if (notFound || !lesson) return <Navigate to="/" replace />;
    if (loadError) {
        return (
            <ErrorFallback
                title="No pudimos cargar la leccion"
                message="Intenta recargar para continuar."
            />
        );
    }

    const primaryColor = subject?.uiConfig?.primaryColor || '#334155';
    const secondaryColor = subject?.uiConfig?.secondaryColor || '#f1f5f9';
    const canFinalize = lesson.type !== 'practice' || practiceCompleted;

    const renderTheoryContent = () => {
        const content = lesson.content;

        if (typeof content === 'string') {
            return <p style={{ marginTop: 0, color: '#1f2937' }}>{content}</p>;
        }

        if (content && typeof content === 'object') {
            const imageUrl = content.image || content.imageUrl || content.url;

            return (
                <div>
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={lesson.title}
                            style={{
                                width: '100%',
                                maxWidth: '480px',
                                borderRadius: '12px',
                                border: `2px solid ${primaryColor}`,
                                marginBottom: '1rem'
                            }}
                        />
                    ) : null}
                    <pre
                        style={{
                            margin: 0,
                            padding: '0.85rem',
                            borderRadius: '10px',
                            background: '#f8fafc',
                            overflowX: 'auto',
                            color: '#0f172a'
                        }}
                    >
                        {JSON.stringify(content, null, 2)}
                    </pre>
                </div>
            );
        }

        return <p style={{ marginTop: 0, color: '#475569' }}>No hay contenido disponible.</p>;
    };

    return (
        <RouteContainer>
            <div style={{ minHeight: '100vh', padding: '1.5rem' }}>
            <Link
                to={`/unidades/${lesson.unitId}/lecciones`}
                style={{
                    display: 'inline-block',
                    textDecoration: 'none',
                    color: '#334155',
                    fontWeight: 600,
                    marginBottom: '1rem'
                }}
            >
                ⬅️ Volver a la Unidad
            </Link>

            <header
                style={{
                    background: secondaryColor,
                    border: `2px solid ${primaryColor}`,
                    borderRadius: '18px',
                    padding: '1.25rem',
                    marginBottom: '1rem'
                }}
            >
                <h1 style={{ margin: 0, color: primaryColor }}>{lesson.title}</h1>
                <p style={{ margin: '0.35rem 0 0', color: '#475569' }}>
                    Tipo: {lesson.type}
                </p>
            </header>

            <section
                style={{
                    background: '#ffffff',
                    border: `2px solid ${primaryColor}`,
                    borderRadius: '14px',
                    padding: '1rem',
                    boxShadow: '0 12px 28px rgba(15, 23, 42, 0.08)',
                    maxWidth: '900px'
                }}
            >
                {lesson.type === 'theory' ? renderTheoryContent() : null}
                {lesson.type === 'practice' ? (
                    subject?.slug === 'matematicas' ? (
                        <MathTableGenerator
                            content={lesson.content}
                            lessonId={lesson._id}
                            onComplete={() => setPracticeCompleted(true)}
                            onReset={() => setPracticeCompleted(false)}
                            primaryColor={primaryColor}
                        />
                    ) : (
                        <div>
                            <p style={{ marginTop: 0, color: '#1f2937' }}>
                                Actividad Practica
                            </p>
                            <button
                                type="button"
                                onClick={() => setPracticeCompleted(true)}
                                style={{
                                    border: `2px solid ${primaryColor}`,
                                    background: '#ffffff',
                                    color: primaryColor,
                                    borderRadius: '10px',
                                    padding: '0.45rem 0.8rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                }}
                            >
                                Marcar actividad como completada
                            </button>
                        </div>
                    )
                ) : null}
                {lesson.type !== 'theory' && lesson.type !== 'practice' ? (
                    <p style={{ marginTop: 0, color: '#1f2937' }}>
                        Esta actividad estara disponible muy pronto.
                    </p>
                ) : null}
            </section>

            {canFinalize ? (
                <div style={{ marginTop: '1rem' }}>
                    <button
                        type="button"
                        onClick={handleFinishLesson}
                        disabled={saving}
                        style={{
                            border: 'none',
                            background: primaryColor,
                            color: '#ffffff',
                            borderRadius: '10px',
                            padding: '0.65rem 1rem',
                            fontWeight: 700,
                            cursor: saving ? 'wait' : 'pointer'
                        }}
                    >
                        {saving ? 'Guardando...' : 'Finalizar Leccion'}
                    </button>
                    {saveSuccess ? (
                        <p style={{ margin: '0.75rem 0 0', color: '#15803d', fontWeight: 600 }}>
                            ¡Progreso guardado!
                        </p>
                    ) : null}
                </div>
            ) : null}
            </div>
        </RouteContainer>
    );
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<SubjectsPage />} />
                <Route path="/materias/:subjectSlug" element={<LevelsPage />} />
                <Route path="/niveles/:levelSlug" element={<UnitsPage />} />
                <Route path="/unidades/:unitId/lecciones" element={<LessonsPage />} />
                <Route path="/leccion/:id" element={<LessonDetailView />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
