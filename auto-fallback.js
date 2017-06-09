'use strict'

function mkPosix (opts) {
  return `
command_not_found_${opts.isBash ? 'handle' : 'handler'}() {
  # Do not run within a pipe
  if test ! -t 1; then
    >&2 echo "command not found: $1"
    return 127
  fi
  echo "$1 not found. Trying with npx..." >&2
  if ! [[ $1 =~ @ ]]; then
    exec npx --no-install "$@"
  fi
  exec npx "$@"
}`
}

function mkFish (opts) {
  return `
function __fish_command_not_found_on_interactive --on-event fish_prompt
  functions --erase __fish_command_not_found_handler
  functions --erase __fish_command_not_found_setup

  function __fish_command_not_found_handler --on-event fish_command_not_found
    echo "$argv[1] not found. Trying with npx..." >&2
    if string match -q -r @ $argv[1]
        npx $argv
    else
        npx --no-install $argv
    end
  end

  functions --erase __fish_command_not_found_on_interactive
end`
}

module.exports = autoFallback
function autoFallback (shell, fromEnv, opts) {
  if (shell.includes('bash')) {
    return mkPosix({isBash: true, install: opts.install})
  }

  if (shell.includes('zsh')) {
    return mkPosix({isBash: false, install: opts.install})
  }

  if (shell.includes('fish')) {
    return mkFish(opts)
  }

  if (fromEnv) {
    return autoFallback(fromEnv, null, opts)
  }

  console.error('Only Bash, Zsh, and Fish shells are supported :(')
}
