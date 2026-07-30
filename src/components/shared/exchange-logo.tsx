"use client";

interface ExchangeLogoProps {
  size?: number;
  showText?: boolean;
  showTenant?: boolean;
  tenantName?: string | null;
}

export function ExchangeLogo({
  size = 32,
  showText = true,
  showTenant = false,
  tenantName,
}: ExchangeLogoProps) {
  const iconSize = size;
  const strokeWidth = size <= 32 ? 2 : 2.5;

  return (
    <div className="flex items-center gap-2.5">
      <div
        className="relative flex items-center justify-center rounded-xl shadow-sm"
        style={{
          width: iconSize,
          height: iconSize,
          background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #1e40af 100%)",
        }}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: iconSize * 0.6, height: iconSize * 0.6 }}
        >
          {/* Top arrow - curves right */}
          <path
            d="M7 13.5C7 13.5 10 7.5 16 7.5C22 7.5 25 13.5 25 13.5"
            stroke="white"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M25 13.5L21.5 10.5M25 13.5L22 15.5"
            stroke="white"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Bottom arrow - curves left */}
          <path
            d="M25 18.5C25 18.5 22 24.5 16 24.5C10 24.5 7 18.5 7 18.5"
            stroke="white"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7 18.5L10.5 15.5M7 18.5L10 21.5"
            stroke="white"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col">
          <span
            className="font-bold text-gray-900 leading-tight"
            style={{ fontSize: Math.max(12, size * 0.4) }}
          >
            صرافیکس
          </span>
          {showTenant && tenantName && (
            <span
              className="text-gray-400 leading-tight"
              style={{ fontSize: Math.max(9, size * 0.25) }}
            >
              {tenantName}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
