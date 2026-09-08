// Seats are laid out in fixed-width rows purely for the visual grid -
// this has no relation to real venue geography, just enough structure
// for an interactive seating chart.
export const SEATS_PER_ROW = 10;

// Builds Seat documents (not yet saved) for an event, one per unit of
// quantity across all price tiers, in tier order. Row/col are continuous
// across tier boundaries so a tier doesn't have to end on a row boundary.
// Label format is "R{row}S{col}" (not letters) so it never collides past
// 26 rows the way "A1".."Z10" would on a large-capacity event.
export const buildSeatsForEvent = (event) => {
  const seats = [];
  let index = 0;

  event.priceTiers.forEach((tier) => {
    for (let i = 0; i < tier.quantity; i++) {
      const row = Math.floor(index / SEATS_PER_ROW);
      const col = index % SEATS_PER_ROW;
      seats.push({
        event: event._id,
        tierName: tier.name,
        row,
        col,
        label: `R${row + 1}S${col + 1}`,
        status: "available",
      });
      index++;
    }
  });

  return seats;
};
