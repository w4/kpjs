import ScriptInterceptor from "./ScriptInterceptor";

document.addEventListener("beforescriptexecute", ScriptInterceptor, true);