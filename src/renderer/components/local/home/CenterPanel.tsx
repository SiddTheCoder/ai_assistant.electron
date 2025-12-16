import { Button } from '@/components/ui/button'
import { useSocket } from '@/context/socketContextProvider'
import React, { useEffect } from 'react'
import axios from "axios"
import type { IAiResponsePayload } from 'types'
import { useSparkTTS } from '@/context/sparkTTSContext'
import ServerStatusShower from '../ServerStatusShower'


export default function CenterPanel() {
  const { socket, isConnected, on, emit, off } = useSocket()
  const { speak, stop, isSpeaking } = useSparkTTS();
   const [status, setStatus] = React.useState<string>("Not started");
  
  const getAudio = async(text:string | undefined) => {
    console.log("htting api now")
   const res = await axios.post(
     `${import.meta.env.VITE_API_BASE_URL}/api/tts`,
     {
       text: text,
     },
     { responseType: "arraybuffer" }
   );
    
    console.log("REs", res)
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
    app_name: "whatsapp",
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
  
  const play = () => {
    speak(
      "कोई बात नहीं है, सर। सब ठीक हो जाएगा। क्या हुआ जो इतनी माफी मांग रहे हैं?"
    );
  }

  const hit = async () => {
    try {
    
       console.log("🟢 Calling window.electronApi.runPythonAction...");

       const res = await window.electronApi.runPythonAction(obj);

       console.log("🟢 Response received:", res);
       setStatus(`Response: ${JSON.stringify(res)}`);

       if (res.status === "ok") {
         console.log("✅ Action completed:", res.result);
       } else {
         console.error("❌ Action failed:", res.message);
       }
    } catch (error) {
      console.error("❌ Error calling Python action:", error);
      setStatus(`Error: ${error}`);
    }
  }

  
  return (
    <div>
      <Button onClick={() => getAudio("हो गया सर, देख सकते हैं। कुछ और चाहिए?")}>get Audio Http</Button>
      <Button onClick={() => play()}>play ws sound</Button>
      <div className="mt-4 p-2 bg-gray-900 rounded">
        <p className="text-sm">Status: {status}</p>
        <ServerStatusShower />
      </div>
    </div>
  );
}
