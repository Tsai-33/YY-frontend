export default function Loading() {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div>
        <div className="flex justify-center space-x-1">
          <span className="text-6xl font-bold text-gray-400 animate-bounce" style={{ animationDelay: "0ms" }}>
            L
          </span>
          <span className="text-6xl font-bold text-gray-400 animate-bounce" style={{ animationDelay: "100ms" }}>
            o
          </span>
          <span className="text-6xl font-bold text-gray-400 animate-bounce" style={{ animationDelay: "200ms" }}>
            a
          </span>
          <span className="text-6xl font-bold text-gray-400 animate-bounce" style={{ animationDelay: "300ms" }}>
            d
          </span>
          <span className="text-6xl font-bold text-gray-400 animate-bounce" style={{ animationDelay: "400ms" }}>
            i
          </span>
          <span className="text-6xl font-bold text-gray-400 animate-bounce" style={{ animationDelay: "500ms" }}>
            n
          </span>
          <span className="text-6xl font-bold text-gray-400 animate-bounce" style={{ animationDelay: "600ms" }}>
            g
          </span>
          <span className="text-6xl font-bold text-gray-400 animate-bounce" style={{ animationDelay: "700ms" }}>
            .
          </span>
          <span className="text-6xl font-bold text-gray-400 animate-bounce" style={{ animationDelay: "800ms" }}>
            .
          </span>
          <span className="text-6xl font-bold text-gray-400 animate-bounce" style={{ animationDelay: "600ms" }}>
            .
          </span>
        </div>
      </div>
    </div>
  );
}
