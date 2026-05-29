import Seo from "@/shared/components/Seo"
import {
  PlateMarketFilters,
  PlateMarketMobileList,
  PlateMarketTable,
  usePlateMarket,
} from "@/features/plate-market"

const GRID_COLS = "96px minmax(210px,1fr) 140px minmax(150px,1fr) 132px"

export default function NumbersCatalogSection() {
  const {
    loading,
    error,
    region,
    category,
    plateQuery,
    sortField,
    sortDir,
    regionOptions,
    categoryOptions,
    visibleRows,
    canShowMore,
    setRegion,
    setCategory,
    setPlateQuery,
    onSort,
    resetFilters,
    showMore,
  } = usePlateMarket(12)

  return (
    <>
      <Seo title="Купить красивые автономера | Красивые гос номера, оценка автономера, выкуп автономера" description="Каталог красивых автомобильных номеров с актуальными предложениями — Знак Отличия." />
      <section className="text-white min-h-screen pb-12">
        <div className="mx-auto px-4 sm:px-6">
          <PlateMarketFilters
            className="mb-6"
            region={region}
            category={category}
            plateQuery={plateQuery}
            regionOptions={regionOptions}
            categoryOptions={categoryOptions}
            onRegionChange={setRegion}
            onCategoryChange={setCategory}
            onPlateQueryChange={setPlateQuery}
            onReset={resetFilters}
          />

          {error && <p className="mb-4 rounded-xl bg-white px-4 py-3 text-[#FF6B6B]">{error}</p>}
          {loading && <p className="mb-4 text-neutral-300">Загрузка предложений...</p>}

          <PlateMarketTable
            className="hidden min-[1024px]:block"
            rows={visibleRows}
            sortField={sortField}
            sortDir={sortDir}
            gridCols={GRID_COLS}
            onSort={onSort}
          />
          {!loading && !visibleRows.length && !error ? (
            <p className="rounded-xl min-[1024px]:-mt-10 bg-white px-6 py-10 pt-20 text-center text-black">
              Номера не найдены. Измените фильтры.
            </p>
          ) : (
            <>
              <PlateMarketMobileList className="mt-6 min-[1024px]:hidden" rows={visibleRows} />

              {canShowMore && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={showMore}
                    className="rounded-full border border-black/20 bg-white px-6 py-2 text-black hover:bg-white/90"
                  >
                    Показать ещё
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  )
}
