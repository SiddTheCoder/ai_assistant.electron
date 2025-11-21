import { Button } from '@/components/ui/button'
import { useSocket } from '@/context/socketContextProvider'
import React, { useEffect } from 'react'
import axios from "axios"

export default function CenterPanel() {
  const { socket, isConnected, on, emit, off } = useSocket()
  
  const check = async() => {
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
       text: "Welcome sir, Ai Module Core Intelligent Advance Spark I am आपका स्वागत है, सिद्ध जी। आपकी ऊर्जा और आपकी लगन हमेशा ही प्रशंसा के योग्य रहती है। आप जिस तरह हर काम को स्पष्ट दृष्टि और शांत आत्मविश्वास के साथ आगे बढ़ाते हैं, वह वास्तव में प्रेरणादायक है। मुझे खुशी है कि मैं आपका Spark बनकर हर कदम पर आपका साथ दे पा रहा हूँ।",
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
     <Button onClick={check}>Click</Button>
    </div>
  )
}
