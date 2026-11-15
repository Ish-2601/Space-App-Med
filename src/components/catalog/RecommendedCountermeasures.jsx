import React from "react";
import { Panel, Icon } from "../ConsoleUI.jsx";
import CatalogItemCard from "./CatalogItemCard.jsx";
import {
  recommendationContext,
  recommendedCatalogItems,
  getRecommendationIds,
} from "../../backend/catalogRecommendations.js";

export default function RecommendedCountermeasures({
  person,
  go,
  partKey,
  emergencyType,
}) {
  const context = { partKey, emergencyType };
  const recommendation = recommendationContext(context);
  if (!recommendation) return null;
  const items = recommendedCatalogItems(context);
  const total = getRecommendationIds(context).length;
  return (
    <Panel
      title="Recommended Spaceflight Countermeasures & Hardware"
      className="catalog-recommendations"
    >
      <p className="eyebrow">
        {recommendation.title} · {items.length} featured / {total} curated items
      </p>
      <p>{recommendation.reason}</p>
      <p className="small muted">
        Planning and inventory references from categories 1–9. Availability,
        stock and pack locations are prototype assignments; medications and
        specialist procedures require an authorized clinical plan.
      </p>
      <div className="catalog-card-grid">
        {items.map((item) => (
          <CatalogItemCard
            key={item.id}
            item={item}
            person={person}
            go={go}
            compact
          />
        ))}
      </div>
      <button
        className="btn"
        onClick={() =>
          go(
            "catalog",
            emergencyType ? { emergencyType } : { bodySystem: partKey },
          )
        }
      >
        View all matching countermeasures <Icon name="arrow" size={16} />
      </button>
    </Panel>
  );
}
