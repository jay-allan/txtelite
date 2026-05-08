# TXTELITE — Project Instructions for Claude

## Project goal

Maintain and extend the TypeScript/Node.js port of TXTELITE (Text Elite 1.5).
The port must preserve identical game behaviour and pass the full QA suite.

**Current port:** `txtelite.ts` — TypeScript/Node.js. Build with `npx tsc`,
run with `node dist/txtelite.js`. Passes all 16 QA tests including T15/T16
(byte-for-byte output matches against pre-baked golden files).

## QA requirement — mandatory

**Every implementation must be verified with the `/qa-txtelite` command before
reporting it as working.** Run it against any interpreter command:

```sh
/qa-txtelite node dist/txtelite.js   # TypeScript port
/qa-txtelite python txtelite.py      # Python port (example)
/qa-txtelite go run txtelite.go      # Go port (example)
```

The command is defined in `.claude/commands/qa-txtelite.md`. It runs 16 test
cases and reports PASS/FAIL for each. Tests T01–T13 are fully deterministic and
must all pass on every correct implementation. T14 (spears route smoke test)
requires a profitable run (exactly 330.6 CR with the SAS LCG default) with no
bad-jump errors. T15 and T16 diff full stdout against pre-baked golden files in
`testdata/` — no compiled binary needed at test time.

Do not claim an implementation is correct unless `/qa-txtelite` reports at
least 15/16 (T01–T15 all passing). A perfect port will also pass T16.

## Architecture notes

- **Galaxy seed**: Fixed 48-bit seed produces all 256 planets deterministically.
  Planet positions, names, distances, economy, government, tech level are all
  fixed — they never change and do not depend on RNG.
- **Market generation**: `genmarket(fluct, planet)` — prices and quantities
  depend on `fluct & maskbyte`, planet economy, and commodity base values using
  8-bit overflow arithmetic. The initial Lave market uses `fluct=0x00`
  (hardcoded), so it is always identical regardless of RNG mode or platform.
- **RNG modes**: `nativerand=false` (default) uses the built-in SAS Institute
  LCG seeded at 12345 (`lastrand = 12344`); `nativerand=true` uses a portable
  ANSI LCG. Toggled at runtime with the `rand` command. All markets after the
  first jump are RNG-dependent. The SAS LCG produces identical output on every
  platform and language, making T14, T15, and T16 fully deterministic.
- **Fuel cost**: 2.0 CR/LY. Distances use `ftoi(4 * sqrt(dx²+dy²/4))` with
  rounding; all values are fixed from the galaxy seed.
- **Hold**: Default 20t. `hold <n>` resizes it. Buy quantity is capped at
  `min(requested, available_in_market, holdspace_free)`.
- **Command parsing**: `stringbeg(s1, s2)` checks if s1 is a prefix of s2
  (case-insensitive). Abbreviations work for all commands and commodity names.

## Deterministic test values (must match exactly)

### Lave initial market (fluct=0x00)

| Commodity    | Price | Qty  |
|--------------|-------|------|
| Food         | 3.6   | 16t  |
| Textiles     | 6.0   | 15t  |
| Radioactives | 20.0  | 17t  |
| Slaves       | 6.0   | 0t   |
| Liquor/Wines | 23.2  | 20t  |
| Luxuries     | 94.4  | 14t  |
| Narcotics    | 49.6  | 55t  |
| Computers    | 89.6  | 0t   |
| Machinery    | 58.8  | 10t  |
| Alloys       | 33.2  | 12t  |
| Firearms     | 75.6  | 0t   |
| Furs         | 52.4  | 9t   |
| Minerals     | 10.8  | 58t  |
| Gold         | 36.8  | 7kg  |
| Platinum     | 64.4  | 1kg  |
| Gem-Stones   | 16.0  | 0g   |
| Alien Items  | 51.2  | 0t   |

### Key planet data

| Planet   | Position  | TL | Economy     | Government      |
|----------|-----------|----|-------------|-----------------|
| Lave     | (20, 173) |  5 | Rich Agri   | Dictatorship    |
| Zaonce   | (33, 185) | 12 | Average Ind | Corporate State |

### Inter-system distances

| Leg                    | Distance |
|------------------------|----------|
| Lave → Zaonce          | 5.7 LY   |
| Zaonce → Bemaera       | 6.9 LY   |
| Bemaera → Ensoreus     | 5.3 LY   |

### Cash checkpoints (starting from 100.0 CR)

| Action                                | Cash after |
|---------------------------------------|------------|
| j zaonce, f 99                        | 88.6 CR    |
| + j bemaera, f 99                     | 74.8 CR    |
| + j ensoreus, f 99                    | 64.2 CR    |
| b food 5, s food 5 (same market)      | 100.0 CR   |
| b food 99 (buys 16t at 3.6)           | 42.4 CR    |
| hold 5, b food 99 (buys 5t at 3.6)    | 82.0 CR    |

## Test scripts

- `spears.txt` — short narcotics/furs run (CRLF line endings — port must
  handle or strip `\r`). With the SAS LCG default, produces exactly **330.6 CR**
  (fully deterministic on any platform). Used by T14 and T15.
- `sinclair.txt` — long multi-leg route with `cash -400` cheat. The `rand`
  toggle on line 1 is skipped (`tail -n +2`) for T16 so both implementations
  stay on the SAS LCG; the 20116-line golden file is in `testdata/`.

## Platform notes

- The port defaults to the SAS LCG (`nativerand=false`). The correct
  deterministic result for `spears.txt` is **330.6 CR**.
- Do not use the `rand`-toggled native mode for QA — its output is not
  reproducible across languages.
