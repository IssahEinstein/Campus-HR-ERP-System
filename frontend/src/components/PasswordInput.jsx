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
    setIsTemporarilyRevealed((prev) => (prev ? false : prev));
  };

  const handleChange = (event) => {
    const nextValue = event.target.value;
    const previousValue = previousValueRef.current ?? "";
    const nativeInputType = event.nativeEvent?.inputType;

    // Keep parent-controlled form state in sync first to avoid stale submit values.
    if (onChange) {
      onChange(event);
    }

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
  };

  const handleBlur = (event) => {
    // Defer masking on blur so submit handlers can read the exact latest value first.
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setTimeout(() => {
      setIsTemporarilyRevealed(false);
    }, 0);

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
