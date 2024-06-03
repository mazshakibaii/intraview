import { DeepgramContextProvider } from "@/lib/deepgram/DeepgramProvider"
import { MicrophoneContextProvider } from "@/lib/deepgram/MicrophoneProvider"

export default function IntraviewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MicrophoneContextProvider>
      <DeepgramContextProvider>{children}</DeepgramContextProvider>
    </MicrophoneContextProvider>
  )
}
