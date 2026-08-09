/**
 * Error mapping — turns engine/bridge failure codes into human-readable messages with a
 * recovery action. The UI shows these; raw codes and stack traces stay in the logs.
 */
export interface FriendlyError {
  title: string
  message: string
  action: string
}

const MAP: Record<string, FriendlyError> = {
  ENGINE_MISSING: {
    title: 'The website engine is missing',
    message: 'Architect OS Studio could not find its built-in website engine.',
    action: 'Reinstall the application, or set the engine path in Settings → Advanced.'
  },
  PYTHON_MISSING: {
    title: 'The website engine could not start',
    message: 'The engine runtime is not available on this computer.',
    action: 'Reinstall the application. If the problem continues, contact your administrator.'
  },
  ENGINE_ERROR: {
    title: 'Generation failed',
    message: 'Something went wrong while building the website.',
    action: 'Open View Reports for details, or export logs from Settings and contact support.'
  },
  ENGINE_BAD_OUTPUT: {
    title: 'Unexpected engine response',
    message: 'The engine returned a result the app could not read.',
    action: 'Try Generate Again. If it persists, export logs and contact support.'
  },
  IR_INVALID: {
    title: 'The mockups look incomplete',
    message: 'The analyzed website is missing required pieces (for example a page or its content).',
    action: 'Return to Upload, add the missing pages, and re-run analysis.'
  },
  NO_PAGES: {
    title: 'No pages detected',
    message: 'No pages could be detected from the uploaded mockups.',
    action: 'Upload at least one page mockup (PNG, JPG, WebP, or PDF) and try again.'
  },
  no_supported_files: {
    title: 'No supported mockups found',
    message: 'The input folder has files, but none are supported page mockups.',
    action: 'Add PNG, JPG, JPEG, WebP, or PDF files and run analysis again.'
  },
  no_input_path: {
    title: 'Input folder was not provided',
    message: 'The app did not tell the engine where the mockups are.',
    action: 'Reopen the project and re-upload the mockups. If it persists, export logs from Settings.'
  },
  input_not_found: {
    title: "Input folder isn't on disk",
    message: 'The project input folder could not be found where the app expected it.',
    action: 'Re-upload the mockups, or check the Project location in Settings.'
  },
  FIDELITY_LOW: {
    title: 'Quality below target',
    message: 'The generated website did not reach the 95% fidelity target.',
    action: 'Review the Blueprint, adjust page/component choices, and Generate Again.'
  },
  BUILDER_UNAVAILABLE: {
    title: 'Builder not available yet',
    message: 'This builder backend is on the roadmap but not installed yet.',
    action: 'Choose Elementor, which is fully supported today.'
  }
}

export function friendly(code?: string): FriendlyError {
  return (code && MAP[code]) || {
    title: 'Something went wrong',
    message: 'An unexpected problem occurred.',
    action: 'Try again, or export logs from Settings and contact support.'
  }
}
