import { runScheduler } from './src/lib/scheduler/scheduleOrchestrator';
import { ExcelDataProvider } from './src/lib/scheduler/dataLoader';

async function main() {
  const result = await runScheduler(new ExcelDataProvider(), new Date(0));
  const tails = [...new Set(result.scheduledBlocks.map(b => b.tailNumber))].sort();

  console.log(`Unscheduled trips: ${result.unscheduled.length}`);
  if (result.unscheduled.length > 0) {
    for (const u of result.unscheduled.slice(0, 5)) console.log(`  FN${u.flightNumber}: ${u.reason.slice(0, 120)}`);
  }

  // Horizon reference: earliest flight departure
  const flightBlocks = result.scheduledBlocks.filter(b => b.type === 'FLIGHT');
  const horizonStart = new Date(Math.min(...flightBlocks.map(b => b.start.getTime())));

  console.log(`\nFlight horizon start: ${horizonStart.toISOString().slice(0, 10)}\n`);
  console.log('Tail       | Flights | Maint blocks | Sample maint events (day offsets from horizon start)');
  console.log('-----------|---------|--------------|-----------------------------------------------------');

  for (const tail of tails) {
    const maintBlocks = result.scheduledBlocks
      .filter(b => b.tailNumber === tail && b.type === 'MAINT')
      .sort((a, b) => a.start.getTime() - b.start.getTime());
    const flightBlocks2 = result.scheduledBlocks.filter(b => b.tailNumber === tail && b.type === 'FLIGHT');

    // Only show maint blocks within the 90-day flight window
    const windowEnd = new Date(horizonStart.getTime() + 90 * 24 * 3_600_000);
    const inWindow = maintBlocks.filter(b => b.start.getTime() < windowEnd.getTime() && b.start.getTime() >= horizonStart.getTime() - 30 * 24 * 3_600_000);

    const sample = inWindow.slice(0, 6).map(mb => {
      const day = ((mb.start.getTime() - horizonStart.getTime()) / (24 * 3_600_000)).toFixed(0);
      return `d${day}(${mb.durationHours}h)`;
    }).join(', ');

    console.log(
      tail.padEnd(10) + ' | ' +
      String(flightBlocks2.length).padStart(7) + ' | ' +
      String(inWindow.length).padStart(12) + ' | ' +
      sample
    );
  }

  // Post-maintenance gap check
  let violations = 0;
  for (const tail of tails) {
    const mb2 = result.scheduledBlocks.filter(b => b.tailNumber === tail && b.type === 'MAINT');
    const fb2 = result.scheduledBlocks.filter(b => b.tailNumber === tail && b.type === 'FLIGHT');
    for (const mb of mb2) {
      for (const fb of fb2) {
        if (fb.start.getTime() > mb.end.getTime()) {
          const gapH = (fb.start.getTime() - mb.end.getTime()) / 3_600_000;
          if (gapH < 4) { violations++; }
        }
      }
    }
  }
  console.log(`\nPost-maintenance gap violations: ${violations === 0 ? 'none ✓' : violations}`);
}
main().catch(console.error);
