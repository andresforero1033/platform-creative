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
    <section id="equipo" className="relative overflow-hidden pb-24">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-0 top-1/3 h-44 w-44 rounded-full bg-brand-blue/15 blur-3xl" />
        <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-brand-purple/15 blur-3xl" />
      </div>

      <div className="app-content">
        <p className="glass-badge-blue">Equipo</p>
        <h2 className="text-3xl font-black text-slate-900 md:text-5xl">Equipo de Trabajo</h2>
        <p className="mt-3 max-w-2xl text-slate-700 md:text-lg">
          Ingenieria educativa de alto nivel para construir experiencias escalables y medibles.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {members.map((member) => (
            <article
              key={member.name}
              className={`glass-card group p-6 ${
                member.featured
                  ? 'border-brand-purple/35 shadow-glow lg:col-span-2'
                  : 'border-slate-200 hover:border-brand-blue/35'
              }`}
            >
              <div
                className={`absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl ${
                  member.featured ? 'bg-brand-purple/25' : 'bg-brand-blue/20'
                }`}
              />
              <h3 className="relative text-xl font-black text-slate-900">{member.name}</h3>
              <p className="relative mt-2 text-sm font-semibold text-slate-700">{member.role}</p>
              {member.description ? (
                <p className="relative mt-3 text-sm text-slate-600">{member.description}</p>
              ) : null}

              <div className="relative mt-5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70">
                <div
                  className={`h-full rounded-full transition-all duration-500 group-hover:w-full ${
                    member.featured ? 'w-4/5 bg-brand-purple' : 'w-2/3 bg-brand-blue'
                  }`}
                />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Team
