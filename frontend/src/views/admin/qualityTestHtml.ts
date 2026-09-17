// 模型常把 HTML 包在 ```html 围栏里或前后附带说明；预览只取文档本体。
export function extractHtml(output: string): string {
  const fenced = output.match(/```(?:html)?\s*\n([\s\S]*?)```/i)
  const body = fenced ? fenced[1] : output
  const start = body.search(/<!doctype html|<html/i)
  return (start >= 0 ? body.slice(start) : body).trim()
}
