/**
 * Storybookの画面レベル試験（結合試験）用の`EventContext`プロバイダー。
 *
 * 実際の`EventsLayout`（`src/app/events/layout.tsx`）は認証ガード（Supabase）・
 * `/api/init`取得・ApplicationBar等を含み画面試験の対象を大きく広げてしまうため、
 * 画面試験ではページコンポーネントをこのプロバイダーで直接ラップし、
 * `EventContext`の値のみを注入する。
 */

import React, { ReactNode } from "react";
import { EventContext, EventContextType } from "@/app/events/EventContext";
import { GameConstants } from "@/constants/gameConstants";
import { buildEventWithRelations, buildUsersWithRelations } from "@/stories/mocks/fixtures";

/**
 * `EventContext`の既定値。overridesで必要な項目だけ上書きする。
 * @return {EventContextType} 既定のcontext値
 */
export const buildDefaultEventContextValue = (): EventContextType => ({
    teams: [],
    stations: [],
    nearbyStations: [],
    documents: [],
    user: buildUsersWithRelations(),
    event: buildEventWithRelations(),
    versionPath: GameConstants.VERSION.V03.path,
    isInitDataLoading: false,
    contextError: null,
    rawInitData: null,
});

interface MockEventProviderProps {
    value?: Partial<EventContextType>;
    children: ReactNode;
}

/**
 * `EventContext`にfixtureを注入するテスト用プロバイダー
 * @param {Partial<EventContextType>} value - 上書きするcontext値
 * @param {ReactNode} children - 子要素（試験対象のページコンポーネント）
 * @return {React.JSX.Element} プロバイダーでラップされた要素
 */
export const MockEventProvider: React.FC<MockEventProviderProps> = ({ value, children }) => (
    <EventContext.Provider value={{ ...buildDefaultEventContextValue(), ...value }}>
        {children}
    </EventContext.Provider>
);
