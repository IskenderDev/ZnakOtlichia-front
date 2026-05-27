import { useEffect, useMemo, useState } from "react"
import { createSearchParams, Link, useNavigate, useParams } from "react-router-dom"
import { LuArrowLeft } from "react-icons/lu"
import Seo from "@/shared/components/Seo"
import PlateStaticLg from "@/shared/components/plate/PlateStaticLg"
import PlateStaticSm from "@/shared/components/plate/PlateStaticSm"
import { formatPrice } from "@/shared/lib/format"
import { formatPhone, normalizePhone } from "@/shared/lib/phone"
import { buildCarNumberFromParts, buildContactPrefill } from "@/shared/lib/plate"
import { paths } from "@/shared/routes/paths"
import { numbersApi } from "@/shared/services/numbersApi"
import type { NumberItem } from "@/entities/number/types"

export default function NumberDetailsSection() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [item, setItem] = useState<NumberItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" })
  }, [id])

  useEffect(() => {
    if (!id) return
    let mounted = true

    setLoading(true)
    setError(null)

    numbersApi
      .get(id)
      .then((data) => {
        if (mounted) setItem(data)
      })
      .catch((err) => {
        if (!mounted) return
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Не удалось загрузить номер"
        )
      })
      .finally(() => mounted && setLoading(false))

    return () => {
      mounted = false
    }
  }, [id])

  const contactPrefill = useMemo(() => {
    if (!item) return { carNumber: "", feedbackType: "buy" as const }
    return buildContactPrefill(item)
  }, [item])

  const contactSearch = useMemo(() => {
    const params = createSearchParams({
      ...(contactPrefill.carNumber
        ? { carNumber: contactPrefill.carNumber }
        : {}),
      feedbackType: contactPrefill.feedbackType,
    }).toString()

    return params ? `?${params}` : ""
  }, [contactPrefill])

  if (loading) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-[#0b0b0c] text-white">
        <p className="text-neutral-300">Загрузка...</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-[#0b0b0c] text-white">
        <p className="text-[#EB5757]">{error}</p>
      </section>
    )
  }

  if (!item) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-[#0b0b0c] text-white">
        <p className="text-neutral-300">Номер не найден</p>
      </section>
    )
  }

  const price = formatPrice(item.markupPrice ?? item.originalPrice)
  const publishedDate = item.date
    ? new Date(item.date).toLocaleDateString("ru-RU")
    : "—"

  const numberLabel = buildCarNumberFromParts({
    ...item.plate,
    regionCode: item.region,
    fullCarNumber: item.series,
    fullNumber: item.series,
  })
  const sellerName = item.sellerName || item.seller || "—"
  const phone = item.phone ? formatPhone(item.phone) : "—"

  const detailsRows = [
    {
      label: "Регион",
      value: item.plate.regionCode ? `RUS ${item.plate.regionCode}` : "—",
    },
    { label: "Дата размещения", value: publishedDate },
    { label: "Имя", value: sellerName },
    { label: "Телефон", value: phone, isPhone: !!item.phone },
  ]

  const handleBuyClick = () => {
    navigate(
      { pathname: paths.contacts, search: contactSearch },
      { state: { leadPrefill: contactPrefill } }
    )
  }

  return (
    <>
      <Seo
        title={`Номер ${numberLabel || item.series} — Знак Отличия`}
        description={`Предложение от ${sellerName}. Стоимость ${price}.`}
      />

      <section className="bg-[#0b0b0c] py-6 sm:py-8 lg:py-10 text-white">
        <div className="mx-auto w-full max-w-[1220px] px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link to={paths.home}>
              <button
                type="button"
                onClick={() => navigate(-1)}
                aria-label="Назад"
                className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0177FF] shadow-[0_10px_30px_rgba(1,119,255,0.6)] transition-colors hover:bg-[#0C8BFF] sm:h-11 sm:w-11"
              >
                <LuArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </button>
            </Link>

            <h1 className="flex flex-wrap items-baseline gap-x-1 gap-y-1 text-[22px] font-bold leading-[1.2] tracking-[0.01em] sm:text-[26px] lg:text-[36px]">
              <span>Продам номер</span>
              <span className="ml-1 font-auto-number uppercase">
                {numberLabel}
              </span>
            </h1>
          </div>

          <div className="mt-6 lg:mt-8 rounded-[32px] border border-[#151515] bg-[#0b0b0c] px-3 py-5  sm:px-6 sm:py-6 lg:px-10 lg:py-8">
            <div className="flex justify-center px-1 sm:px-4 lg:px-8">
              <PlateStaticSm
                data={{
                  price: item.markupPrice ?? item.originalPrice,
                  comment: item.plate.comment ?? item.description ?? "",
                  firstLetter: item.plate.firstLetter,
                  secondLetter: item.plate.secondLetter,
                  thirdLetter: item.plate.thirdLetter,
                  firstDigit: item.plate.firstDigit,
                  secondDigit: item.plate.secondDigit,
                  thirdDigit: item.plate.thirdDigit,
                  regionId: item.plate.regionCode || item.region,
                }}
                responsive
                className="w-full min-[670px]:hidden"
              />

              <PlateStaticLg
                data={{
                  price: item.markupPrice ?? item.originalPrice,
                  comment: item.plate.comment ?? item.description ?? "",
                  firstLetter: item.plate.firstLetter,
                  secondLetter: item.plate.secondLetter,
                  thirdLetter: item.plate.thirdLetter,
                  firstDigit: item.plate.firstDigit,
                  secondDigit: item.plate.secondDigit,
                  thirdDigit: item.plate.thirdDigit,
                  regionId: item.plate.regionCode || item.region,
                }}
                responsive
                showCaption
                className="hidden w-full min-[670px]:block"
              />
            </div>

         
            <div className="mt-6 lg:mt-8 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]  lg:gap-8">
              <div className="rounded-[24px] border border-[#252525] bg-[#0b0b0c] px-4 py-4  sm:px-6 sm:py-5 lg:px-7 lg:py-6">
                <dl className="divide-y divide-[#262626]">
                  {detailsRows.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between py-3 sm:py-3.5"
                    >
                      <dt className="pr-4 text-[14px] font-semibold leading-[18px] text-white sm:text-[15px]">
                        {row.label}
                      </dt>
                      <dd className="text-right text-[16px] leading-[20px] text-[#F5F5F5] sm:text-[18px] sm:leading-[22px] font-normal">
                        {row.isPhone && item.phone ? (
                          <a
                            href={`tel:+${normalizePhone(item.phone)}`}
                            className="transition-colors hover:text-white"
                          >
                            {row.value}
                          </a>
                        ) : (
                          row.value
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-4 border-t border-[#262626] pt-4 sm:mt-5 sm:pt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                  <div className="text-[22px] font-medium leading-none sm:text-[26px] lg:text-[30px]">
                    {price}
                  </div>

                  <button
                    onClick={handleBuyClick}
                    className="inline-flex min-h-[44px] min-w-[150px] items-center justify-center rounded-full bg-[#0177FF] px-6 py-2.5 text-[15px] font-medium leading-[18px] tracking-[0.01em] text-white shadow-[0_10px_30px_rgba(1,119,255,0.6)] transition-colors hover:bg-[#0C8BFF] sm:min-h-[46px] sm:px-7 sm:text-[16px] lg:min-h-[48px] lg:px-8 lg:text-[18px] lg:leading-[22px]"
                  >
                    Купить
                  </button>
                </div>
              </div>

              <div className="rounded-[24px] border border-[#252525] bg-[#0b0b0c] px-4 py-4 text-[15px] leading-[1.5] text-[#E5E5E5] sm:px-6 sm:py-5 lg:px-7 lg:py-6 sm:text-[16px] lg:text-[18px] lg:leading-[1.55]">
              
                <h2 className="sr-only">Важная информация</h2>
                <ul className="list-disc space-y-3 sm:space-y-3.5 pl-5 marker:text-[#0177FF]">
                  <li>
                    Начиная с 2020 года вы можете оформить автомобильный номер
                    только того региона, в котором прописаны.
                  </li>
                  <li>
                    Передача автомобильного номера подразумевает под собой
                    куплю/продажу транспортного средства.
                  </li>
                  <li>
                    Оформление не включено в указанную стоимость.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
