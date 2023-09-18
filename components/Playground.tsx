'use client'

import { useEffect, useState } from 'react'

import { Session } from '@e2b/sdk'
const logger = {
  debug: console.debug, // log debug messages, in default logger this is noop
  info: console.info, // log info messages, in default logger this is noop
  // don't forget to also specify warn & error handlers, otherwise they won't be logged when overriding the logger
  warn: console.warn,
  error: console.error,
}

// function fetchCode() {
//   fetch('http://localhost:3002', {
//     method: 'POST',
//     headers: {
//       'Content-type': 'application/json',
//     },
//     body: JSON.stringify({ task }),
//   })
// }


function Playground() {
  const [playground, setPlayground] = useState<Session | null>(null)
  const [url, setURL] = useState<string>('')

  async function initPlayground() {
    const session = await Session.create({
      id: 'pTqrJ3prLCDI', // Custom env made for generating react/nextjs code
      apiKey: process.env.NEXT_PUBLIC_E2B_API_KEY!,
      logger,
    })

    console.log('WRITING FILES')
    setTimeout(async () => {
      await session.filesystem.write('/code/template/components/Component.jsx', `
      import { Alert } from "@/components/ui/alert";
      import { Button } from "@/components/ui/button";

  export default function CookieConsentBanner() {
    return (
      <Alert type="info" className="flex items-center justify-between bg-white">
        <div className="flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M19 10a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <span className="text-sm">
            This website uses cookies to ensure you get the best experience on our website.
          </span>
        </div>
        <Button className="ml-4">Accept</Button>
      </Alert>
    );
  }
  `)
  console.log('DONE')
    }, 2000)

    setURL('https://' + session.getHostname(3000))
    setPlayground(session)
  }

  useEffect(function init() {
    // initPlayground()
  }, [])

  return (
    <div className="w-full h-[400px] bg-red-500 rounded-md bg-zinc-100 p-4">
        {/* <iframe
          className="w-full h-full rounded-md"
          src="http://localhost:3000"
        /> */}
      {url && (
        <iframe
          className="w-full h-full rounded-md"
          src={url}
        />
      )}
    </div>
  )
}

export default Playground