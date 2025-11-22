import { Button } from '@/components/ui/button'
import { useSocket } from '@/context/socketContextProvider'
import React, { useEffect } from 'react'
import axios from "axios"
import type { IAiResponsePayload } from 'types'

export default function CenterPanel() {
  const { socket, isConnected, on, emit, off } = useSocket()
   const [status, setStatus] = React.useState<string>("Not started");
  
  const getAudio = async(text:string | undefined) => {
    // console.log("Socket", socket, isConnected)
    // if (!socket || !isConnected) return
    // console.log("emmiting the message now")
    // emit("send-user-text-query", "Hello Spark Whats up?")
    // console.log("emmited the message")
    // on("query-result", (data) => { 
    //   console.log("query Result",data)
    // })
    console.log("htting api now")
   const res = await axios.post(
     `${import.meta.env.VITE_API_URL}/api/tts`,
     {
       text: text,
     },
     { responseType: "arraybuffer" }
   );
    
    console.log("REs", res)

    // play audio
     // Convert ArrayBuffer → Blob → URL → Play
   const audioBlob = new Blob([res.data], { type: "audio/mpeg" });
   const audioUrl = URL.createObjectURL(audioBlob);

   const audio = new Audio(audioUrl);
   audio.play();
  }


  const obj: IAiResponsePayload = {
  userQuery: "Spark open notepad",
  answer: "नोटपैड खोल रहा हूं, सर।",
  answerEnglish: "Opening notepad, Sir.",
  actionCompletedMessage: "हो गया सर, देख सकते हैं। कुछ और चाहिए?",
  actionCompletedMessageEnglish: "Done Sir, you can check. Need anything else?",
  action: "open_notepad",
  emotion: "neutral",
  answerDetails: {
    content: "Hey there new is me lorem ipsum",
    sources: [],
    references: [],
    additional_info: {}
  },
  actionDetails: {
    type: "open_app",
    query: "open notepad",
    title: "",
    artist: "",
    topic: "",
    platforms: [],
    app_name: "chrome",
    target: "",
    location: "",
    searchResults: [],
    confirmation: {
      isConfirmed: true,
      actionRegardingQuestion: ""
    },
    additional_info: {}
  }
}

  const hit = async () => {
    try {
      await getAudio(obj.answer)
       console.log("🟢 Calling window.electronApi.runPythonAction...");

       const res = await window.electronApi.runPythonAction(obj);

       console.log("🟢 Response received:", res);
       setStatus(`Response: ${JSON.stringify(res)}`);

       if (res.status === "ok") {
         console.log("✅ Action completed:", res.result);
         await getAudio(obj.actionCompletedMessage);
       } else {
         console.error("❌ Action failed:", res.message);
       }
    } catch (error) {
      console.error("❌ Error calling Python action:", error);
      setStatus(`Error: ${error}`);
    }
  }

  // useEffect(() => {
  //   console.log("htting the python subprocess now")
  //   hit()
  // }, [])

  // useEffect(() => {
  //   console.log("Socket", socket, isConnected)
  //   if (!socket || !isConnected) return
  //   emit("send-user-text-query", "Hello Spark Whats up?")
  //   on("query-result", (data) => { 
  //     console.log("query Result",data)
  //   })

  //   return () => {
  //     off("query-result")
  //   }
    
  // }, [socket, isConnected, on, emit, off])
  return (
    <div>
      <Button onClick={() => hit()}>Click</Button>
      <div className="mt-4 p-2 bg-gray-900 rounded">
        <p className="text-sm">Status: {status}</p>
      </div>
    </div>
  )
}
