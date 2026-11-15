import React, { useMemo, useState } from "react";
import {
  SPACEFLIGHT_CATALOG_1000,
  CATALOG_CATEGORIES,
  CATALOG_ITEM_TYPES,
  CATALOG_PACK_COLORS,
} from "../data/spaceflightCatalog1000.ts";
import { HEALTH_AREAS } from "../data/healthAreas.js";
import { useStore } from "../backend/store.js";
import { sandboxEnabled } from "../backend/sandbox.js";
import {
  catalogDisplayName,
  catalogHistory,
  filterCatalog,
} from "../backend/catalog.js";
import { getRecommendationIds } from "../backend/catalogRecommendations.js";
import CatalogItemCard from "../components/catalog/CatalogItemCard.jsx";
import { PageTitle, Panel, Icon } from "../components/ConsoleUI.jsx";

const PAGE_SIZE = 24;
export default function SpaceflightCatalog({ person, go, params = {} }) {
  const state = useStore();
  const [filters, setFilters] = useState(() => ({
    query: params.itemId ? `#${params.itemId}` : "",
    categoryId: params.categoryId || "",
    bodySystem: params.bodySystem || "",
    packColor: params.packColor || "",
    itemType: params.itemType || "",
    emergencyType: params.emergencyType || "",
  }));
  const [page, setPage] = useState(0);
  const matches = useMemo(
    () =>
      filterCatalog({
        ...filters,
        relatedIds: filters.bodySystem
          ? getRecommendationIds({ bodySystem: filters.bodySystem })
          : [],
        ids: filters.emergencyType
          ? getRecommendationIds({ emergencyType: filters.emergencyType })
          : undefined,
      }),
    [filters],
  );
  const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = matches.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE,
  );
  const history = catalogHistory(state, person.id).slice(0, 12);
  const edit = (key, value) => {
    setFilters((previous) => ({ ...previous, [key]: value }));
    setPage(0);
  };
  const reset = () => {
    setFilters({
      query: "",
      categoryId: "",
      bodySystem: "",
      packColor: "",
      itemType: "",
      emergencyType: "",
    });
    setPage(0);
  };
  return (
    <div className="spaceflight-catalog">
      <PageTitle
        eyebrow="Onboard reference · All 1,000 entries"
        title="1,000-Item Spaceflight Catalog & Countermeasure Explorer"
        description="Find equipment, habits and digital tools for your mission. Explore every item, record a rehearsal or open its connected workflow."
      />
      <div className="catalog-overview">
        <div>
          <strong>{SPACEFLIGHT_CATALOG_1000.length.toLocaleString()}</strong>
          <span>catalog entries</span>
        </div>
        <div>
          <strong>10 × 100</strong>
          <span>complete domains</span>
        </div>
        <div>
          <strong>100</strong>
          <span>software launchers</span>
        </div>
        <div>
          <strong>{sandboxEnabled(state) ? "Private" : "Onboard"}</strong>
          <span>local logging workspace</span>
        </div>
      </div>
      <p className="catalog-notice">
        User-supplied beneficial-catalog concepts, including experimental
        equipment and medicines. Names are retained from the supplied list;
        inclusion is not a NASA endorsement or treatment recommendation. Pack
        colors and stock are demo assignments. A logged unit is an inventory
        unit, not a clinical dose.
      </p>
      <Panel title="Explore the catalog" className="catalog-filters">
        <label className="catalog-search">
          <span>
            <Icon name="search" />
            Search all 1,000 entries
          </span>
          <input
            type="search"
            value={filters.query}
            onChange={(e) => edit("query", e.target.value)}
            placeholder="Name, item number, category or purpose…"
            autoComplete="off"
          />
        </label>
        <div
          className="catalog-categories"
          role="group"
          aria-label="Catalog categories"
        >
          <button
            className={!filters.categoryId ? "selected" : ""}
            aria-pressed={!filters.categoryId}
            onClick={() => edit("categoryId", "")}
          >
            All domains <b>1,000</b>
          </button>
          {CATALOG_CATEGORIES.map((category) => (
            <button
              key={category.id}
              className={
                Number(filters.categoryId) === category.id ? "selected" : ""
              }
              aria-pressed={Number(filters.categoryId) === category.id}
              onClick={() => edit("categoryId", category.id)}
            >
              <span>
                {category.id}. {category.name}
              </span>
              <b>100</b>
            </button>
          ))}
        </div>
        <div className="catalog-filter-row">
          <label>
            Body system
            <select
              value={filters.bodySystem}
              onChange={(e) => edit("bodySystem", e.target.value)}
            >
              <option value="">All 10 body systems</option>
              {Object.entries(HEALTH_AREAS).map(([key, area]) => (
                <option value={key} key={key}>
                  {area.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            NASA pack color (demo assignment)
            <select
              value={filters.packColor}
              onChange={(e) => edit("packColor", e.target.value)}
            >
              <option value="">All pack colors</option>
              {CATALOG_PACK_COLORS.map((color) => (
                <option key={color}>{color}</option>
              ))}
            </select>
          </label>
          <label>
            Item type
            <select
              value={filters.itemType}
              onChange={(e) => edit("itemType", e.target.value)}
            >
              <option value="">All item types</option>
              {CATALOG_ITEM_TYPES.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <button className="btn" onClick={reset}>
            Clear filters
          </button>
        </div>
        {filters.emergencyType && (
          <p className="catalog-context">
            Showing the equipment selection for the {filters.emergencyType}{" "}
            protocol.{" "}
            <button
              className="text-link"
              onClick={() => edit("emergencyType", "")}
            >
              Show other items
            </button>
          </p>
        )}
      </Panel>
      <div className="catalog-results-heading">
        <h2>Catalog results</h2>
        <p role="status" aria-live="polite">
          {matches.length.toLocaleString()} of 1,000 entries
          {matches.length > 0
            ? ` · showing ${currentPage * PAGE_SIZE + 1}–${Math.min((currentPage + 1) * PAGE_SIZE, matches.length)}`
            : ""}
        </p>
      </div>
      {!matches.length && (
        <div className="empty-state">
          <h3>No entries match these filters</h3>
          <p>
            Try a broader name, another system or clear the category selection.
          </p>
          <button className="btn" onClick={reset}>
            Show all 1,000 entries
          </button>
        </div>
      )}
      <div className="catalog-card-grid">
        {visible.map((item) => (
          <CatalogItemCard key={item.id} item={item} person={person} go={go} />
        ))}
      </div>
      {matches.length > PAGE_SIZE && (
        <nav className="catalog-pagination" aria-label="Catalog result pages">
          <button
            className="btn"
            disabled={currentPage === 0}
            onClick={() => setPage(currentPage - 1)}
          >
            ← Previous
          </button>
          <label>
            Page
            <select
              value={currentPage}
              onChange={(e) => setPage(Number(e.target.value))}
            >
              {Array.from({ length: pageCount }, (_, index) => (
                <option value={index} key={index}>
                  {index + 1} of {pageCount}
                </option>
              ))}
            </select>
          </label>
          <button
            className="btn"
            disabled={currentPage + 1 >= pageCount}
            onClick={() => setPage(currentPage + 1)}
          >
            Next →
          </button>
        </nav>
      )}
      <Panel
        title={
          sandboxEnabled(state)
            ? "Your private catalog history"
            : "Your recent catalog history"
        }
        className="catalog-history"
      >
        <p className="small muted">
          {sandboxEnabled(state)
            ? "Private records and private stock consumption stay separate from the shared inventory, crew health, notifications and Earth-link queue."
            : "Saved on this device per crew member. Catalog usage does not prescribe treatment or alter clinical readings."}
        </p>
        {!history.length ? (
          <p>
            No catalog activity yet. Use any item card to record a check or
            session.
          </p>
        ) : (
          <ol>
            {history.map((record) => (
              <li key={record.id}>
                <span>
                  <b>
                    #{record.payload.code}{" "}
                    {catalogDisplayName(record.payload.name)}
                  </b>
                  <small>
                    Day {record.day} ·{" "}
                    {record.payload.action === "dispense"
                      ? `${record.payload.quantity} inventory unit(s)`
                      : record.payload.action === "log"
                        ? `${record.payload.minutes} min · ${record.payload.result}`
                        : record.payload.result}
                  </small>
                  {record.payload.note && <span>{record.payload.note}</span>}
                </span>
                <button
                  className="btn small"
                  onClick={() => {
                    reset();
                    setFilters((previous) => ({
                      ...previous,
                      query: `#${record.payload.code}`,
                    }));
                  }}
                >
                  Find item
                </button>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </div>
  );
}
