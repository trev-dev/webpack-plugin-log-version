import { exec } from 'child_process'
import os from 'os'

const deriveCommand = () => {
  switch (os.type()) {
    case 'Linux':
    case 'Darwin':
      return 'which git'
    case 'Windows_NT':
      return 'where git'
    default:
      return null
  }
}

const runCommand = (command: string) => {
  return new Promise<string | null>((res, rej) => {
    exec(command, (err, stdout) => {
      if (err) {
        rej(err)
      }
      res(stdout)
    })
  })
}

export const gitAvailable = async () => {
  const command = deriveCommand()
  const cannotGit = new Error(
    'LogVersionPlugin cannot locate git on your system - options.git disabled'
  )

  if (command === null) {
    throw cannotGit
  }

  try {
    await runCommand(command)
  }
  catch {
    throw cannotGit
  }
  return true
}

export const gitCommand = async (command: string) => {
  const commandError = new Error(`Git command failed: ${command}`)

  try {
    const stdout = await runCommand(command)
    if (stdout === null) throw commandError
    return stdout
  }
  catch (e) {
    throw commandError
  }
}