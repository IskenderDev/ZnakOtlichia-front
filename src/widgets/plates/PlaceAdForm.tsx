import { useCallback, useEffect, useState } from "react";
import Toast from "@/shared/components/Toast";
import ConsentNotice from "@/shared/components/ConsentNotice";
import PlateSelectForm from "@/features/plate-select/ui/PlateSelectForm";
import { DEFAULT_PLATE_VALUE, type PlateSelectValue } from "@/features/plate-select/model/types";
import { numbersApi } from "@/shared/services/numbersApi";
import { useAuth } from "@/shared/lib/hooks/useAuth";
import { isPasswordCompromised } from "@/shared/lib/security/passwordLeakCheck";
import PageTopSpacing from "@/shared/components/PageTopSpacing";
import PhoneInput from "@/shared/ui/PhoneInput";
import { isPhoneComplete } from "@/shared/lib/phone";

const TYPE_OPTIONS = [
  { label: "Купить номер", value: "buy" },
  { label: "Продать номер", value: "sell" },
];

type FormState = {
  name: string;
  phone: string;
  email: string;
  password: string;
  price: string;
  type: string;
  comment: string;
};

type ToastState = { type: "success" | "error"; msg: string } | null;

const INITIAL_FORM: FormState = {
  name: "",
  phone: "",
  email: "",
  password: "",
  price: "",
  type: TYPE_OPTIONS[1]?.value ?? "sell",
  comment: "",
};

const INITIAL_PLATE: PlateSelectValue = { ...DEFAULT_PLATE_VALUE };

export default function PlaceAdForm() {
  const { isAuthenticated } = useAuth();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [plate, setPlate] = useState<PlateSelectValue>(INITIAL_PLATE);
  const [toast, setToast] = useState<ToastState>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string>("");

  const requiresContactInfo = !isAuthenticated;

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timeout);
  }, [toast]);

  const handleInputChange: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = (
    event,
  ) => {
    const { name, value, type, checked } = event.target as HTMLInputElement;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };


  const isSubmitDisabled =
    loading ||
    !form.price.trim() ||
    plate.text.includes("*") ||
    !plate.regionCode.trim() ||
    plate.regionId == null ||
    (requiresContactInfo && (!form.name.trim() || !isPhoneComplete(form.phone)));

  const resetForm = useCallback(() => {
    setForm(INITIAL_FORM);
    setPlate(INITIAL_PLATE);
  }, []);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    if (isSubmitDisabled) {
      setToast({ type: "error", msg: "Заполните все обязательные поля" });
      return;
    }

    const series = plate.text.replace(/\*/g, "");
    const regionCode = plate.regionCode.trim();
    const priceValue = normalizePrice(form.price);

    if (!series || series.length !== 6) {
      setToast({ type: "error", msg: "Укажите корректный номер" });
      return;
    }

    if (!regionCode) {
      setToast({ type: "error", msg: "Выберите регион" });
      return;
    }

    if (!Number.isFinite(priceValue) || priceValue <= 0) {
      setToast({ type: "error", msg: "Укажите корректную стоимость" });
      return;
    }

    const regionId = plate.regionId;
    if (regionId == null || !Number.isFinite(regionId) || regionId <= 0) {
      setToast({ type: "error", msg: "Укажите корректный регион" });
      return;
    }

    const trimmedPassword = form.password.trim();
    if (requiresContactInfo && !isPhoneComplete(form.phone)) {
      setPhoneError("Введите номер телефона полностью");
      setToast({ type: "error", msg: "Введите номер телефона полностью" });
      return;
    }

    if (requiresContactInfo && trimmedPassword.length < 3) {
      setToast({ type: "error", msg: "Пароль должен содержать минимум 3 символа" });
      return;
    }

    if (requiresContactInfo) {
      const compromised = await isPasswordCompromised(trimmedPassword);
      if (compromised) {
        setToast({
          type: "error",
          msg: "Этот пароль найден в базах утечек. Пожалуйста, выберите другой пароль.",
        });
        return;
      }
    }

    const plateParts = extractPlateParts(plate);
    const comment = form.comment.trim();

    setLoading(true);
    setError(null);

    try {
      if (isAuthenticated) {
        await numbersApi.createAuthorized({
          originalPrice: priceValue,
          firstLetter: plateParts.firstLetter,
          secondLetter: plateParts.secondLetter,
          thirdLetter: plateParts.thirdLetter,
          firstDigit: plateParts.firstDigit,
          secondDigit: plateParts.secondDigit,
          thirdDigit: plateParts.thirdDigit,
          comment: comment ? comment : undefined,
          regionId,
        });
      } else {
        await numbersApi.createAndRegister({
          originalPrice: priceValue,
          firstLetter: plateParts.firstLetter,
          secondLetter: plateParts.secondLetter,
          thirdLetter: plateParts.thirdLetter,
          firstDigit: plateParts.firstDigit,
          secondDigit: plateParts.secondDigit,
          thirdDigit: plateParts.thirdDigit,
          comment: comment ? comment : undefined,
          regionId,
          fullName: form.name.trim(),
          phoneNumber: form.phone.trim(),
          email: form.email.trim() ? form.email.trim() : undefined,
          password: trimmedPassword,
        });
      }
      setToast({ type: "success", msg: "Объявление отправлено на модерацию" });
      setPhoneError("");
      resetForm();
    } catch (error: unknown) {
      const message = extractErrorMessage(error, "Не удалось отправить объявление");
      setError(message);
      setToast({ type: "error", msg: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTopSpacing>
      <section className=" text-white pb-12 lg:pb-16" aria-label="Размещение объявления">
        {toast && <Toast type={toast.type} message={toast.msg} onClose={() => setToast(null)} />}

        <div className="max-w-[900px] mx-auto px-5 sm:px-8">
          <h2 className="text-center text-3xl lg:text-4xl font-bold uppercase">
            РАЗМЕСТИТЬ ОБЪЯВЛЕНИЕ
          </h2>
          <p className="text-center text-neutral-300 mt-2 text-sm lg:text-base">
            Все сделки сопровождаются юридической поддержкой
          </p>

          <div className="mt-6 lg:mt-8">
            <PlateSelectForm
              size="xs"
              responsive
              flagSrc="/flag-russia.svg"
              showCaption={false}
              className="mx-auto w-full sm:hidden"
              value={plate}
              onChange={setPlate}
            />
            <PlateSelectForm
              size="md"
              responsive
              flagSrc="/flag-russia.svg"
              showCaption={false}
              className="mx-auto hidden w-full sm:block"
              value={plate}
              onChange={setPlate}
            />
          </div>

          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {requiresContactInfo && (
                <>
                  <input
                    type="text"
                    inputMode="text"
                    className={INPUT_BASE}
                    placeholder="Имя *"
                    aria-label="Имя"
                    name="name"
                    value={form.name}
                    onChange={handleInputChange}
                    required
                  />

                    <PhoneInput
                      className={INPUT_BASE}
                      placeholder="Телефон *"
                      aria-label="Телефон"
                      name="phone"
                      value={form.phone}
                      onChange={(value) => {
                        setForm((prev) => ({ ...prev, phone: value }));
                        if (phoneError && isPhoneComplete(value)) {
                          setPhoneError("");
                        }
                      }}
                      required
                    />
                    {phoneError ? <p className="mt-1 text-xs text-[#EB5757]">{phoneError}</p> : null}

                  <input
                    type="email"
                    inputMode="email"
                    className={INPUT_BASE}
                    placeholder="Почта"
                    aria-label="Почта"
                    name="email"
                    value={form.email}
                    onChange={handleInputChange}
                  />

                  <input
                    type="password"
                    autoComplete="new-password"
                    className={INPUT_BASE}
                    placeholder="Пароль"
                    aria-label="Пароль"
                    name="password"
                    value={form.password}
                    onChange={handleInputChange}
                  />
                </>
              )}

              <input
                type="text"
                inputMode="numeric"
                className={`${INPUT_BASE} sm:col-span-2`}
                placeholder="Стоимость *"
                aria-label="Стоимость"
                name="price"
                value={form.price}
                onChange={handleInputChange}
                required
              />
            </div>

            <p className="text-[12px] text-[#bebebe]">
              <span className='text-[#EF4444]'>*</span> При публикации объявления к конечной стоимости добавляется комиссия в размере 10–30% минимум
            </p>

          

            <textarea
              className={`${INPUT_BASE} w-full min-h-[110px] resize-y`}
              placeholder="Комментарий"
              aria-label="Комментарий"
              name="comment"
              value={form.comment}
              onChange={handleInputChange}
            />

            {error && <p className="text-sm text-[#EB5757]">{error}</p>}

            <ConsentNotice className="text-[#94A3B8]" />

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className="rounded-full w-full sm:w-auto px-10 py-3 bg-[#1E63FF] hover:bg-[#1557E0] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors"
                aria-label="Разместить объявление"
              >
                {loading ? "Отправка..." : "Разместить"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </PageTopSpacing>
  );
}

const INPUT_BASE =
  "bg-[#F8F9FA] text-black placeholder-[#777] rounded-4xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1E63FF]";

const normalizePrice = (value: string): number => {
  if (!value) return NaN;
  const normalized = value.replace(/[^0-9.,]/g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
};

type PlateParts = {
  firstLetter: string;
  secondLetter: string;
  thirdLetter: string;
  firstDigit: string;
  secondDigit: string;
  thirdDigit: string;
};

const extractPlateParts = (plate: PlateSelectValue): PlateParts => {
  const text = (plate.text || "").toUpperCase();

  return {
    firstLetter: text[0] ?? "",
    firstDigit: text[1] ?? "",
    secondDigit: text[2] ?? "",
    thirdDigit: text[3] ?? "",
    secondLetter: text[4] ?? "",
    thirdLetter: text[5] ?? "",
  };
};

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (error && typeof error === "object") {
    const withMessage = error as { message?: unknown; response?: { data?: { message?: unknown; error?: unknown } } };
    const responseMessage = withMessage.response?.data?.message;
    const responseError = withMessage.response?.data?.error;
    const message = withMessage.message;

    if (typeof responseMessage === "string" && responseMessage.trim()) {
      return responseMessage;
    }
    if (typeof responseError === "string" && responseError.trim()) {
      return responseError;
    }
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return fallback;
};
