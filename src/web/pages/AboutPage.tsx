export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-[#2f2f2f] mb-8">Om os</h1>

      <div className="prose prose-sm max-w-none text-[#4a4a45] space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-[#2f2f2f] mb-3">Vores mission</h2>
          <p>
            Huska er skabt med én klar mission: at gøre hverdagen lettere for danske familier.
            Uanset om I er samboende, co-parenting eller en sammensat familie, fortjener I et
            redskab der samler alt ét sted — uden forvirring og med fuld gennemsigtighed.
          </p>
          <p>
            Vi tror på, at mindre friktion i hverdagen giver mere tid til det der virkelig tæller:
            at være sammen med dem, man holder af.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#2f2f2f] mb-3">Hvem står bag?</h2>
          <p>
            Huska er grundlagt af <strong>Martin Kristensen</strong> og <strong>Frederik Hansen</strong>.
            Vi har selv oplevet, hvor svært det kan være at koordinere hverdagen i en familie — og
            vi savnede et enkelt, dansk værktøj der kunne samle samværsplan, kalender, kommunikation
            og udgifter på ét sted.
          </p>
          <p>
            Derfor byggede vi Huska: en app lavet af forældre, til forældre.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#2f2f2f] mb-3">Hvad er Huska?</h2>
          <p>
            Huska er en alt-i-én platform til familiekoordinering. Appen samler de vigtigste
            funktioner, som familier har brug for i hverdagen:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Samværsplan</strong> — Planlæg samvær med faste eller fleksible modeller</li>
            <li><strong>Fælles kalender</strong> — Alle begivenheder og vigtige datoer ét sted</li>
            <li><strong>Kommunikation</strong> — Strukturerede beskeder og beskedtråde</li>
            <li><strong>Udgiftsdeling</strong> — Hold styr på fælles udgifter og balancer</li>
            <li><strong>Opgaver</strong> — Fordel og følg op på familiens to-dos</li>
            <li><strong>Mad &amp; indkøb</strong> — Madplaner og indkøbslister</li>
            <li><strong>Dokumenter &amp; fotos</strong> — Opbevar og del vigtige filer og minder</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#2f2f2f] mb-3">For alle familietyper</h2>
          <p>
            Huska er designet til at understøtte alle typer familier:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Co-parenting</strong> — Fast eller fleksibel samværsplan mellem to hjem</li>
            <li><strong>Sammensatte familier</strong> — Flere børn, flere kalendere, ét overblik</li>
            <li><strong>Under samme tag</strong> — Fordel opgaver og udgifter i hverdagen</li>
            <li><strong>Professionelle</strong> — Socialrådgivere og sagsbehandlere der støtter familier</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-[#2f2f2f] mb-3">Kontakt</h2>
          <p>
            Har du spørgsmål eller feedback? Vi vil meget gerne høre fra dig.
          </p>
          <p>
            E-mail: <a href="mailto:kontakt@huska.dk" className="text-[#f58a2d] hover:underline">kontakt@huska.dk</a>
          </p>
        </section>
      </div>
    </div>
  );
}
