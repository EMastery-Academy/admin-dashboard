import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  productKeys,
  productQueries,
  searchQueries,
  setProductStatus,
  curriculumQueries,
  type ProductStatus,
} from "@/lib/api";
import { ordersQueries } from "@/lib/api/sales/orders";
import { useT } from "@/lib/i18n";
import { Loading, ErrorAlert } from "@/components/ui/kit";
import { DetailHeader } from "./components/detail-header";
import { DetailTabBar, type DetailTabId } from "./components/detail-tabbar";
import { DetailAside } from "./components/detail-aside";
import { OverviewTab } from "./tabs/overview-tab";
import { ContentTab } from "./tabs/content-tab";
import { ResourcesTab } from "./tabs/resources-tab";
import { InstructorsTab } from "./tabs/instructors-tab";
import { OrdersTab } from "./tabs/orders-tab";
import { RelatedTab } from "./tabs/related-tab";
import { LegacyTab } from "./tabs/legacy-tab";

export function ProductDetailPage() {
  const t = useT();
  const { productId = "" } = useParams<{ productId: string }>();
  const productRef = decodeURIComponent(productId);
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // Tab State
  const tabParam = searchParams.get("tab") as DetailTabId | null;
  const [activeTab, setActiveTab] = useState<DetailTabId>(tabParam || "overview");

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam, activeTab]);

  const handleSelectTab = (tab: DetailTabId) => {
    setActiveTab(tab);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", tab);
        return next;
      },
      { replace: true }
    );
  };

  // Queries
  const productQuery = useQuery(productQueries.detail(productRef));
  const productData = productQuery.data;
  const slug = productData?.b2c ? productData.product.slug : undefined;

  const searchDetailQuery = useQuery({
    ...searchQueries.productDetails(slug ?? ""),
    enabled: Boolean(slug),
  });

  const unitsQuery = useQuery(curriculumQueries.units(productRef));
  const units = unitsQuery.data ?? [];

  const salesQuery = useQuery(productQueries.sales(productRef, { bucket: "month" }));
  const salesData = salesQuery.data;

  // Query orders count for tab badge
  const ordersCountQuery = useQuery(
    ordersQueries.list({
      product_ref: productRef,
      limit: 1,
    })
  );
  const totalOrdersCount = ordersCountQuery.data?.total ?? salesData?.total_orders ?? 0;

  // Publish / Unpublish modal & mutation
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const setStatus = useMutation({
    mutationFn: (status: ProductStatus) => setProductStatus(productRef, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(productRef) });
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      setPublishModalOpen(false);
    },
  });

  if (productQuery.isLoading) {
    return (
      <div style={{ padding: 48 }}>
        <Loading />
      </div>
    );
  }

  if (productQuery.error || !productData) {
    return (
      <div style={{ padding: 24 }}>
        <ErrorAlert error={productQuery.error || new Error(t("المنتج غير موجود", "Product not found"))} />
      </div>
    );
  }

  const item = productData.product;
  const isPublished = item.status === "published";
  const legacyKind =
    productData.links.legacy_kind === "package"
      ? "package"
      : productData.links.legacy_kind === "course"
      ? "course"
      : null;

  // Calculate badge counts
  const totalLessons = units.reduce((acc, u) => acc + (u.lessons?.length || 0), 0);
  const searchDetail = searchDetailQuery.data;
  const searchObj = searchDetail as Record<string, unknown> | undefined;
  const instructorsCount = Array.isArray(searchObj?.instructors)
    ? searchObj.instructors.length
    : Array.isArray(searchObj?.trainers)
    ? searchObj.trainers.length
    : 1;

  const related = searchDetail?.related;
  const relatedCount =
    (related?.courses?.length || 0) +
    (related?.diplomas?.length || 0) +
    (related?.packages?.length || 0) +
    (related?.consultations?.length || 0);

  const tabCounts: Partial<Record<DetailTabId, number>> = {
    content: totalLessons,
    instructors: instructorsCount,
    orders: totalOrdersCount,
    related: relatedCount,
  };

  const showAside = activeTab !== "legacy";

  return (
    <div className="cd-main" style={{ minHeight: "100vh" }}>
      {/* Header & 5-KPI Strip */}
      <DetailHeader
        productRef={productRef}
        data={productData}
        units={units}
        sales={salesData}
        onTogglePublish={() => setPublishModalOpen(true)}
      />

      {/* Sticky Tab Bar */}
      <DetailTabBar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        counts={tabCounts}
        hasLegacy={Boolean(legacyKind)}
        productTitle={item.title ?? undefined}
        isPublished={isPublished}
        onTogglePublish={() => setPublishModalOpen(true)}
      />

      {/* Body with Tabs and Aside */}
      <div className={`cd-body ${showAside ? "" : "cd-body--wide"}`}>
        <div className="cd-page" role="tabpanel">
          {activeTab === "overview" && (
            <OverviewTab
              productRef={productRef}
              data={productData}
              searchDetail={searchDetail}
              units={units}
              onGoToContent={() => handleSelectTab("content")}
            />
          )}

          {activeTab === "content" && <ContentTab productRef={productRef} />}

          {activeTab === "resources" && (
            <ResourcesTab
              productRef={productRef}
              data={productData}
              searchDetail={searchDetail}
            />
          )}

          {activeTab === "instructors" && (
            <InstructorsTab
              productRef={productRef}
              data={productData}
              searchDetail={searchDetail}
            />
          )}

          {activeTab === "orders" && <OrdersTab productRef={productRef} />}

          {activeTab === "related" && (
            <RelatedTab productRef={productRef} detail={searchDetail} />
          )}

          {activeTab === "legacy" && legacyKind && (
            <LegacyTab productRef={productRef} legacyKind={legacyKind} />
          )}
        </div>

        {/* Aside Facts & Completeness */}
        {showAside && (
          <DetailAside
            data={productData}
            searchDetail={searchDetail}
            units={units}
          />
        )}
      </div>

      {/* Publish / Unpublish Confirmation Modal */}
      {publishModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "grid",
            placeItems: "center",
            zIndex: 1000,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setPublishModalOpen(false);
          }}
        >
          <div
            className="cd-card"
            style={{ width: "min(460px, 92vw)", padding: 24, boxShadow: "var(--sh-xl)" }}
          >
            <h2 className="cd-modal__h">
              {isPublished
                ? t("إلغاء نشر المنتج؟", "Unpublish product?")
                : t("نشر المنتج على المنصة؟", "Publish product to platform?")}
            </h2>
            <p className="cd-muted" style={{ marginBlock: "12px 24px", lineHeight: 1.6 }}>
              {isPublished
                ? t(
                    "لن يعود هذا المنتج متاحاً للشراء في الكتالوج العام للطلاب حتى تتم إعادة نشره مجدداً.",
                    "This product will no longer be visible or purchasable in the public student catalog until republished."
                  )
                : t(
                    "سيصبح هذا المنتج متاحاً للشراء والعرض في الكتالوج العام لجميع الطلاب.",
                    "This product will become publicly visible and purchasable in the catalog for all students."
                  )}
            </p>
            <div className="cd-modal__f" style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                type="button"
                className="ma-btn ma-btn--soft"
                onClick={() => setPublishModalOpen(false)}
              >
                {t("إلغاء", "Cancel")}
              </button>
              <button
                type="button"
                className={`ma-btn ${isPublished ? "ma-btn--danger-soft" : "ma-btn--primary"}`}
                disabled={setStatus.isPending}
                onClick={() => setStatus.mutate(isPublished ? "draft" : "published")}
              >
                {setStatus.isPending
                  ? t("جاري التحديث...", "Updating...")
                  : isPublished
                  ? t("تأكيد إلغاء النشر", "Confirm unpublish")
                  : t("تأكيد النشر", "Confirm publish")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default ProductDetailPage;
