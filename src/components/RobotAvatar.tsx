import type { RobotState } from '@/types';

interface RobotAvatarProps {
  state: RobotState;
  size?: number;
  reducedMotion?: boolean;
}

export function RobotAvatar({ state, size = 80, reducedMotion = false }: RobotAvatarProps) {
  const eyeClass = `robot-eye ${state === 'listening' ? 'robot-eye--wide' : ''}`;
  const mouthClass = `robot-mouth robot-mouth--${state}`;
  const antennaClass = `robot-antenna ${reducedMotion ? '' : 'robot-antenna--animated'}`;
  const bodyClass = `robot-body ${reducedMotion ? '' : `robot-body--${state}`}`;

  return (
    <div
      className="robot-avatar"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`AI Buddy robot - ${state}`}
    >
      <style>{`
        @keyframes robotFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes robotPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes robotShake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-2deg); }
          75% { transform: rotate(2deg); }
        }
        @keyframes antennaGlow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        @keyframes eyeBlink {
          0%, 90%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
        @keyframes mouthSpeak {
          0%, 100% { height: 4px; border-radius: 4px; }
          50% { height: 10px; border-radius: 6px; }
        }
        @keyframes mouthListen {
          0%, 100% { transform: scaleX(1); }
          50% { transform: scaleX(1.3); }
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        .robot-avatar {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        .robot-antenna {
          width: 4px;
          height: 12px;
          background: #94a3b8;
          border-radius: 2px;
          margin-bottom: -2px;
          position: relative;
        }
        .robot-antenna::after {
          content: '';
          position: absolute;
          top: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 10px;
          height: 10px;
          background: #3b82f6;
          border-radius: 50%;
          box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
        }
        .robot-antenna--animated::after {
          animation: antennaGlow 1.5s ease-in-out infinite;
        }
        .robot-body {
          background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
          border: 2px solid #0ea5e9;
          border-radius: 18px;
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          box-shadow: 0 4px 15px rgba(14, 165, 233, 0.2);
          position: relative;
        }
        .robot-body--idle { animation: robotFloat 3s ease-in-out infinite; }
        .robot-body--listening { animation: robotPulse 1s ease-in-out infinite; }
        .robot-body--thinking { animation: robotShake 0.8s ease-in-out infinite; }
        .robot-body--speaking { animation: robotPulse 0.6s ease-in-out infinite; }
        .robot-eyes {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .robot-eye {
          width: 10px;
          height: 10px;
          background: #0ea5e9;
          border-radius: 50%;
          animation: eyeBlink 4s ease-in-out infinite;
        }
        .robot-eye--wide {
          width: 12px;
          height: 12px;
          background: #2563eb;
        }
        .robot-mouth {
          width: 16px;
          height: 4px;
          background: #0ea5e9;
          border-radius: 4px;
          transition: all 0.2s ease;
        }
        .robot-mouth--speaking {
          animation: mouthSpeak 0.3s ease-in-out infinite;
        }
        .robot-mouth--listening {
          animation: mouthListen 0.8s ease-in-out infinite;
        }
        .robot-mouth--thinking {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .robot-cheeks {
          display: flex;
          justify-content: space-between;
          width: 100%;
          padding: 0 4px;
          margin-top: -2px;
        }
        .robot-cheek {
          width: 6px;
          height: 6px;
          background: rgba(244, 114, 182, 0.4);
          border-radius: 50%;
        }
        .robot-body--thinking .robot-eye {
          animation: none;
          background: #64748b;
        }
        @media (prefers-reduced-motion: reduce) {
          .robot-body, .robot-antenna::after, .robot-eye, .robot-mouth {
            animation: none !important;
          }
        }
      `}</style>
      <div className={antennaClass} />
      <div className={bodyClass}>
        <div className="robot-eyes">
          <div className={eyeClass} />
          <div className={eyeClass} />
        </div>
        <div className={mouthClass} />
        <div className="robot-cheeks">
          <div className="robot-cheek" />
          <div className="robot-cheek" />
        </div>
      </div>
      {state === 'thinking' && !reducedMotion && (
        <div className="flex gap-1 mt-1.5">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" style={{ animation: 'dotPulse 0.6s ease-in-out infinite', animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" style={{ animation: 'dotPulse 0.6s ease-in-out infinite', animationDelay: '200ms' }} />
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" style={{ animation: 'dotPulse 0.6s ease-in-out infinite', animationDelay: '400ms' }} />
        </div>
      )}
    </div>
  );
}
