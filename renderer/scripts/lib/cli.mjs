/** Positional post key from argv (first non-flag token). */
export function postKeyFromArgv(args) {
  return args.find((a) => !a.startsWith("--") && a !== "-h");
}

export function flagSet(args) {
  return new Set(args.filter((a) => a.startsWith("--")));
}

/** `--name=value` with values that may contain `=`. */
export function flagOpt(args, name, def) {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : def;
}

/** Legacy art-comfyui style: value after first `=` only. */
export function flagOptSimple(args, name, def) {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=")[1] : def;
}

export function showHelpAndExit(helpText) {
  console.log(helpText);
  process.exit(0);
}