'use client'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { CornerDownLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

import Playground from '@/components/Playground'

export default function Home() {
  const [task, setTask] = useState('')

  function sendRequest() {
    fetch('http://localhost:3002', {
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify({ task }),
    })
  }

  return (
    <main className="flex-1 overflow-auto">
      <div className="flex flex-col py-[26vh] px-6 justify-center items-center gap-6">

        <div className="flex items-center justify-center gap-2">
          <Input
            className="w-[380px] max-w-full shadow shadow-xl focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-zinc-400"
            placeholder="A birthday registration form with a date picker"
            value={task}
            onChange={e => setTask(e.target.value)}
            />
          <Button
            className="gap-1 px-4 border shadow shadow-xl bg-transparent hover:bg-zinc-100 hover:border-zinc-400"
            onClick={sendRequest}
          >
            <CornerDownLeft size={14} strokeWidth={2.5} className="text-zinc-500"/>
          </Button>
        </div>

        <Playground/>

      </div>
    </main>
  )
}
