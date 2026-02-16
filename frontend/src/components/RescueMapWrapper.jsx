import { Suspense } from "react";
import RescueMap from "./RescueMap";

// Wrapper to prevent StrictMode double-mounting issues
export default function RescueMapWrapper(props) {
  return (
    <Suspense fallback={<div style={{ height: props.height || "400px" }} className="border border-slate-200 bg-slate-100 flex items-center justify-center">Loading...</div>}>
      <RescueMap {...props} />
    </Suspense>
  );
}
