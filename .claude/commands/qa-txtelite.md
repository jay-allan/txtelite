# TXTELITE QA Verification

Verify a TXTELITE implementation for correctness. The implementation must accept text commands on stdin and print results to stdout, matching the expected game behaviour encoded in the golden files.

## Usage

`/qa-txtelite <command>` — e.g. `/qa-txtelite node dist/txtelite.js` or `/qa-txtelite python txtelite.py`

The argument `$ARGUMENTS` is the command (or command + args) used to invoke the implementation under test.

## How to run

Execute each test case using a pipe or heredoc, e.g.:

```sh
printf 'mkt\nq\n' | $ARGUMENTS
```

For multi-line scripts, use a temp file:
```sh
cat > /tmp/txtelite_test.txt << 'EOF'
<commands>
EOF
$ARGUMENTS < /tmp/txtelite_test.txt
```

## Test Cases

All tests T01–T13 are fully deterministic. They test static data derived from the fixed galaxy seed (planet positions, distances), the initial Lave market (fluct=0x00 hardcoded), or pure arithmetic. They must produce identical results on every correct implementation regardless of platform, language, or RNG backend.

---

### T01: Starting cash

**Input:**
```
q
```
**Assert:** Output contains `100.0` (starting cash is exactly 100.0 CR).

---

### T02: Starting hold

**Input:**
```
q
```
**Assert:** Output contains `20t` (cargo capacity on the fuel/hold status line).

---

### T03: Lave initial market — prices and quantities

**Input:**
```
mkt
q
```
The initial Lave market always uses `fluct=0x00` (hardcoded), making it completely deterministic and RNG-independent. **Assert all of the following appear in the market table:**

| Commodity     | Price | Qty |
|---------------|-------|-----|
| Food          | 3.6   | 16t |
| Textiles      | 6.0   | 15t |
| Radioactives  | 20.0  | 17t |
| Slaves        | 6.0   | 0t  |
| Liquor/Wines  | 23.2  | 20t |
| Luxuries      | 94.4  | 14t |
| Narcotics     | 49.6  | 55t |
| Computers     | 89.6  | 0t  |
| Machinery     | 58.8  | 10t |
| Alloys        | 33.2  | 12t |
| Firearms      | 75.6  | 0t  |
| Furs          | 52.4  | 9t  |
| Minerals      | 10.8  | 58t |
| Gold          | 36.8  | 7kg |
| Platinum      | 64.4  | 1kg |
| Gem-Stones    | 16.0  | 0g  |
| Alien Items   | 51.2  | 0t  |

---

### T04: Buy from Lave market — food

**Input:**
```
b food 99
q
```
**Assert:**
- Output contains `Buying 16` (only 16t available, buy request capped)
- Cash after: `42.4` CR  (100.0 − 16 × 3.6 = 42.4)

---

### T05: Hold limit on buy

**Input:**
```
hold 5
b food 99
q
```
**Assert:**
- Output contains `Buying 5` (hold limit overrides available supply)
- Cash after: `82.0` CR  (100.0 − 5 × 3.6 = 82.0)

---

### T06: Buy then sell — round trip cash

**Input:**
```
b food 5
s food 5
q
```
**Assert:**
- Final cash: `100.0` CR (sell price equals buy price at the same market in the same session)

---

### T07: Planet info — Lave

**Input:**
```
info lave
q
```
**Assert output contains:**
- `LAVE`
- `(20,173)` — position derived from galaxy seed
- Tech Level `5`
- `Dictatorship`

---

### T08: Planet info — Zaonce

**Input:**
```
info zaonce
q
```
**Assert output contains:**
- `ZAONCE`
- `(33,185)` — position derived from galaxy seed
- Tech Level `12`
- `Corporate State`

---

### T09: Local systems from Lave

**Input:**
```
local
q
```
**Assert output contains all of** (all within 7 LY of Lave, derived from galaxy seed):
- `REORTE`
- `RIEDQUAT`
- `LEESTI`
- `ZAONCE`
- `DISO`
- `ORERVE`

---

### T10: Jump to Zaonce — no cash change

**Input:**
```
j zaonce
q
```
**Assert:**
- No `Bad jump` error
- Cash still `100.0` (jumping spends fuel from the fuel tank, not credits)

---

### T11: Jump + refuel cash

**Input:**
```
j zaonce
f 99
q
```
**Assert:**
- No `Bad jump` error
- Output contains `5.7LY` (Lave→Zaonce distance)
- Cash: `88.6` CR  (100.0 − 5.7 × 2.0 = 88.6; fuel is 2 CR/LY)

---

### T12: Jump blocked by fuel range

**Input:**
```
j ensoreus
q
```
**Assert:**
- Output contains `Jump to far` (Ensoreus exists but is >7 LY from Lave, beyond tank capacity)
- Cash still `100.0` (no credits spent, system unchanged)

Note: `Bad jump` is the message for a name that matches no planet other than the current one. `Jump to far` is the message when the planet is found but out of fuel range. Ensoreus is reachable from later in the chain; from Lave it is simply too far.

---

### T13: Chain jumps Lave → Zaonce → Bemaera → Ensoreus with refuels

**Input:**
```
j zaonce
f 99
j bemaera
f 99
j ensoreus
f 99
q
```
**Assert:**
- No `Bad jump` at any step
- Cash after each refuel:
  - After Zaonce refuel: `88.6` CR  (Lave→Zaonce = 5.7 LY)
  - After Bemaera refuel: `74.8` CR  (Zaonce→Bemaera = 6.9 LY)
  - After Ensoreus refuel: `64.2` CR  (Bemaera→Ensoreus = 5.3 LY)
- All distances are fixed by the galaxy seed.

---

### T14: Spears route — smoke test

Run the full trading script from the project directory. The route is:
Lave → Zaonce → Bemaera → Ensoreus → Zaalela (narcotics ×3, then furs).

```sh
$ARGUMENTS < spears.txt
```

**Assert:**
- No `Bad jump` message in output
- All four destination systems appear: `ZAONCE`, `BEMAERA`, `ENSOREUS`, `ZAALELA`
- Final cash **greater than 100.0 CR** (profitable run)
- Program exits cleanly (exit code 0)

Note: All correct ports use the SAS Institute LCG as the default RNG, making T14 fully deterministic. The expected final cash is exactly **330.6 CR**. Assert `> 100.0 CR` as the minimum; assert exactly `330.6` if the port uses the SAS LCG default.

---

### T15: Byte-for-byte comparison against pre-baked spears golden file

The file `testdata/spears_expected.txt` contains the pre-baked expected stdout for `spears.txt`. Because all compliant ports use the SAS LCG seeded at 12345, the output is fully deterministic.

Run the port and diff against the golden file:

```sh
$ARGUMENTS < spears.txt > /tmp/port_out.txt 2>&1
diff testdata/spears_expected.txt /tmp/port_out.txt
```

**Assert:** `diff` exits with code 0 (no differences). If it exits non-zero, show the first 30 lines of diff output to identify where the divergence begins.

The golden file exercises the full RNG sequence across the spears route: nine jumps, three trading sessions, goat-soup planet descriptions, and fuel purchases. Any divergence in market generation, arithmetic, or formatting will appear here.

---

### T16: Byte-for-byte comparison against pre-baked sinclair reference output

The file `testdata/sinclair_expected.txt` contains the pre-baked expected stdout for `sinclair.txt` with the `rand` toggle line (line 1) removed. `sinclair.txt` opens with a `rand` command which would switch to platform-native `rand()` and break determinism. By skipping line 1 all implementations stay on the SAS LCG throughout, making the full 20000+ line output fully deterministic.

Run the port and diff against the golden file:

```sh
tail -n +2 sinclair.txt | $ARGUMENTS > /tmp/port_sinclair.txt 2>&1
diff testdata/sinclair_expected.txt /tmp/port_sinclair.txt
```

**Assert:** `diff` exits with code 0 (no differences). If it exits non-zero, show the first 30 lines of diff output to identify where the divergence begins.

The sinclair route is a long multi-leg run with many galaxy jumps, large buy/sell quantities, and the `cash -400` cheat command. It exercises a much wider slice of the RNG sequence and market arithmetic than spears.txt.

---

## Pass/Fail report

Run all 16 tests and report:

```
T01 Starting cash               PASS / FAIL
T02 Starting hold               PASS / FAIL
T03 Lave market prices+qty      PASS / FAIL
T04 Buy food (qty cap + cash)   PASS / FAIL
T05 Hold limit on buy           PASS / FAIL
T06 Buy/sell round trip         PASS / FAIL
T07 Planet info — Lave          PASS / FAIL
T08 Planet info — Zaonce        PASS / FAIL
T09 Local systems from Lave     PASS / FAIL
T10 Jump — no cash change       PASS / FAIL
T11 Jump + refuel cash          PASS / FAIL
T12 Jump blocked by fuel range  PASS / FAIL
T13 Chain jumps cash chain      PASS / FAIL
T14 Spears route smoke test     PASS / FAIL
T15 Byte-for-byte vs spears golden PASS / FAIL
T16 Byte-for-byte vs sinclair golden PASS / FAIL

TOTAL: X/16
```

For any failure, show the actual output alongside the expected value.

## Notes for porting

- T01–T13 must pass identically on every correct implementation on any platform or language.
- T14 requires no crashes, correct routing, and profit > 100 CR (exactly 330.6 CR with the SAS LCG default).
- T15 requires byte-identical output against `testdata/spears_expected.txt`.
- T16 requires byte-identical output against `testdata/sinclair_expected.txt`. The `rand` toggle on line 1 of `sinclair.txt` is skipped (`tail -n +2`) so the implementation stays on the SAS LCG throughout.
- Fuel is 2.0 CR/LY. All planet distances are deterministic from the galaxy seed.
- If the implementation prints a prompt string (e.g. `> `) before each command, adjust grep assertions accordingly.
- Commodity names and planet names in commands are case-insensitive; verify the port handles this too.
- The `rand` command toggles RNG modes. T03–T13 do not depend on RNG. T14, T15, and T16 require the SAS LCG default.
