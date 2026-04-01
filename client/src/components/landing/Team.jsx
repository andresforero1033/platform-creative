function Team() {
  const members = [
    { name: 'Producto', role: 'Estrategia y vision de aprendizaje' },
    { name: 'Ingenieria', role: 'Backend, IA y experiencia realtime' },
    { name: 'Contenido', role: 'Curacion pedagogica y evaluaciones' },
    {
      name: 'Fabio Andres Forero',
      role: 'Lead Software Engineer & System Architect',
      description: 'Especialista en Sistemas Gobernados, Arquitecturas Escalables y Gamificacion',
      featured: true,
    },
  ]

  return (
    <section id="equipo" className="px-6 pb-24">
      <div className="mx-auto w-full max-w-6xl">
        <h2 className="text-3xl font-black text-slate-900 md:text-4xl">Equipo de Trabajo</h2>
        <p className="mt-3 max-w-2xl text-slate-700">
          Ingenieria educativa de alto nivel para construir experiencias escalables y medibles.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {members.map((member) => (
            <article
              key={member.name}
              className={`rounded-2xl border bg-white/80 p-6 ${member.featured ? 'border-brand-purple shadow-glow lg:col-span-2' : 'border-slate-200'}`}
            >
              <h3 className="text-xl font-bold text-brand-purple">{member.name}</h3>
              <p className="mt-2 text-sm text-slate-700">{member.role}</p>
              {member.description ? <p className="mt-3 text-sm text-slate-600">{member.description}</p> : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Team
