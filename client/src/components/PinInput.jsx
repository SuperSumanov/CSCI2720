import React, { useRef, useEffect } from "react";

const PinInput = ({
  length = 6,
  value,
  onChange,
  isError = false,
  disabled = false,
}) => {
  const inputsRef = useRef([]);

  useEffect(() => {
    // 初次挂载时，如果有第一个 input，自动聚焦
    if (inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, []);

  const handleChange = (index, e) => {
    if (disabled) return;
    const raw = e.target.value;
    const digit = raw.replace(/\D/g, "").slice(-1); // 只保留最后一位数字

    const chars = value.split("");
    chars[index] = digit || "";
    const nextValue = chars.join("").slice(0, length);
    onChange(nextValue);

    if (digit && index < length - 1) {
      const nextInput = inputsRef.current[index + 1];
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (disabled) return;

    if (e.key === "Backspace") {
      if (!value[index] && index > 0) {
        const prevInput = inputsRef.current[index - 1];
        if (prevInput) {
          prevInput.focus();
          prevInput.select();
        }
      }
    }

    if (e.key === "ArrowLeft" && index > 0) {
      const prevInput = inputsRef.current[index - 1];
      if (prevInput) prevInput.focus();
    }

    if (e.key === "ArrowRight" && index < length - 1) {
      const nextInput = inputsRef.current[index + 1];
      if (nextInput) nextInput.focus();
    }
  };

  const handleFocus = (index) => {
    const input = inputsRef.current[index];
    if (input) {
      input.select();
    }
  };

  const chars = value.padEnd(length, " ").split("").slice(0, length);

  return (
    <div className="twofa-pin">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          type="tel"
          inputMode="numeric"
          maxLength={1}
          value={chars[index] === " " ? "" : chars[index]}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onFocus={() => handleFocus(index)}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          disabled={disabled}
          className={isError ? "twofa-pin-input error" : "twofa-pin-input"}
        />
      ))}
    </div>
  );
};

export default PinInput;


