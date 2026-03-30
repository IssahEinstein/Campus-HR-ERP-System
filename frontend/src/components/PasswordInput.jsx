import { useEffect, useRef, useState } from "react";

const DEFAULT_REVEAL_DURATION_MS = 650;

export default function PasswordInput({
  value,
  onChange,
  revealDurationMs = DEFAULT_REVEAL_DURATION_MS,
  onBlur,
  autoCapitalize = "none",
  autoCorrect = "off",
  spellCheck = false,
  ...props
}) {
  const [isTemporarilyRevealed, setIsTemporarilyRevealed] = useState(false);
  const hideTimerRef = useRef(null);
  const previousValueRef = useRef(value ?? "");

  useEffect(() => {
    previousValueRef.current = value ?? "";
  }, [value]);

  useEffect(
    () => () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    },
    [],
  );

  const hideNow = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setIsTemporarilyRevealed(false);
  };

  const handleChange = (event) => {
    const nextValue = event.target.value;
    const previousValue = previousValueRef.current ?? "";
    const nativeInputType = event.nativeEvent?.inputType;

    const typedSingleCharacter =
      nextValue.length === previousValue.length + 1
      && (nativeInputType === "insertText"
        || nativeInputType === "insertCompositionText"
        || nativeInputType == null);
    previousValueRef.current = nextValue;

    if (typedSingleCharacter) {
      setIsTemporarilyRevealed(true);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
      hideTimerRef.current = setTimeout(() => {
        setIsTemporarilyRevealed(false);
        hideTimerRef.current = null;
      }, revealDurationMs);
    } else {
      hideNow();
    }

    if (onChange) {
      onChange(event);
    }
  };

  const handleBlur = (event) => {
    hideNow();
    if (onBlur) {
      onBlur(event);
    }
  };

  return (
    <input
      {...props}
      type={isTemporarilyRevealed ? "text" : "password"}
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      spellCheck={spellCheck}
    />
  );
}
