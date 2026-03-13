import { OverblikSidePanel } from '@/components/custom/OverblikSidePanel';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { familieOgBoernData, type FamilieBoernSection } from '@/data/familieOgBoernData';
import { ExternalLink, Phone, Info } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

function RatesTable({ header, rows }: { header: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border my-2">
      <table className="w-full text-[12px]">
        <thead>
          <tr className="bg-card">
            {header.map((h, i) => (
              <th key={i} className="px-2.5 py-2 text-left font-semibold text-foreground first:pl-3 last:pr-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 1 ? 'bg-card' : 'bg-card'}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-2.5 py-2 text-foreground first:pl-3 last:pr-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionBlock({ section }: { section: FamilieBoernSection }) {
  return (
    <div className="mb-3 last:mb-0">
      <h4 className="text-[13px] font-semibold text-foreground mb-1">{section.title}</h4>
      <p className={`text-[12.5px] leading-[1.55] text-foreground ${section.highlight ? 'bg-orange-tint-light border border-[#f58a2d]/20 rounded-lg px-3 py-2' : ''}`}>
        {section.text}
      </p>
      {section.rates_table && (
        <RatesTable header={section.rates_table.header} rows={section.rates_table.rows} />
      )}
      {section.note && (
        <div className="flex gap-2 items-start bg-blue-tint border border-[#d0e3ff] rounded-lg px-3 py-2 mt-2">
          <Info className="h-3.5 w-3.5 text-[#2563eb] shrink-0 mt-0.5" />
          <p className="text-[11.5px] text-[#1e40af] leading-[1.5]">{section.note}</p>
        </div>
      )}
      {(section.phone || section.url) && (
        <div className="flex flex-wrap gap-2 mt-2">
          {section.phone && (
            <a
              href={`tel:${section.phone.replace(/\s/g, '')}`}
              className="inline-flex items-center gap-1.5 text-[12px] text-[#2563eb] font-medium"
            >
              <Phone className="h-3 w-3" />
              {section.phone}
            </a>
          )}
          {section.url && (
            <a
              href={section.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[12px] text-[#2563eb] font-medium"
            >
              <ExternalLink className="h-3 w-3" />
              Hjemmeside
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export function FamilieOgBoern() {
  return (
    <div className="space-y-1.5 py-1">
      <OverblikSidePanel />

      <div className="px-4 pt-2 pb-1">
        <div className="flex items-center gap-2">
          <h1 className="text-[20px] font-bold text-foreground">Familie & Børn</h1>
          <Popover>
            <PopoverTrigger asChild>
              <button className="text-muted-foreground hover:text-muted-foreground transition-colors">
                <Info className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="bottom" align="start" className="w-72 text-[12px] text-foreground leading-[1.5]">
              Alle beløb er 2026-satser medmindre andet er angivet. Satser reguleres årligt. Oplysningerne er vejledende – søg altid aktuel rådgivning hos de relevante myndigheder.
            </PopoverContent>
          </Popover>
        </div>
        <p className="text-[13px] text-muted-foreground mt-0.5">Dine rettigheder som forælder – opdateret 2026</p>
      </div>

      <div className="px-4">

        <Accordion type="single" collapsible className="w-full">
          {familieOgBoernData.map((category) => {
            const Icon = category.icon;
            return (
              <AccordionItem key={category.id} value={category.id} className="border-b border-border">
                <AccordionTrigger className="hover:no-underline py-3.5 gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-card flex items-center justify-center shrink-0">
                      <Icon className="h-4.5 w-4.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-foreground text-left">{category.title}</p>
                      <p className="text-[11.5px] text-muted-foreground text-left leading-tight mt-0.5 line-clamp-1">{category.short_description}</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-0 pb-4">
                  <p className="text-[12.5px] text-foreground leading-[1.55] mb-3">
                    {category.intro}
                  </p>

                  <div className="space-y-0.5">
                    {category.sections.map((section, i) => (
                      <SectionBlock key={i} section={section} />
                    ))}
                  </div>

                  <a
                    href={category.borger_dk_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 text-[12.5px] font-medium text-[#2563eb] hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Læs mere på borger.dk
                  </a>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}
