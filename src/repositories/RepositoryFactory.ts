import { prisma } from "@/lib/prisma";
import { TeamsRepository } from "./teams/TeamsRepository";
import { GoalStationsRepository } from "./goalStations/GoalStationsRepository";
import { BombiiHistoriesRepository } from "./bombiiHistories/BombiiHistoriesRepository";
import { EventsRepository } from "./events/EventsRepository";
import { EventTypesRepository } from "./eventTypes/EventTypesRepository";
import { StationsRepository } from "./stations/StationsRepository";
import { NearbyStationsRepository } from "./nearbyStations/NearbyStationsRepository";
import { TransitStationsRepository } from "./transitStations/TransitStationsRepository";
import { PointsRepository } from "./points/PointsRepository";

/**
 * Repositoryのファクトリークラス
 * 依存性注入とシングルトンパターンを提供
 */
export class RepositoryFactory {
    private static teamsRepository: TeamsRepository | null = null;
    private static goalStationsRepository: GoalStationsRepository | null = null;
    private static bombiiHistoriesRepository: BombiiHistoriesRepository | null = null;
    private static eventsRepository: EventsRepository | null = null;
    private static eventTypesRepository: EventTypesRepository | null = null;
    private static stationsRepository: StationsRepository | null = null;
    private static nearbyStationsRepository: NearbyStationsRepository | null = null;
    private static transitStationsRepository: TransitStationsRepository | null = null;
    private static pointsRepository: PointsRepository | null = null;
    /**
     * TeamsRepositoryのインスタンスを取得（シングルトン）
     * @returns {TeamsRepository} TeamsRepositoryのインスタンス
     */
    static getTeamsRepository(): TeamsRepository {
        if (!this.teamsRepository) {
            this.teamsRepository = new TeamsRepository(prisma);
        }
        return this.teamsRepository;
    }

    /**
     * GoalStationsRepositoryのインスタンスを取得（シングルトン）
     * @returns {GoalStationsRepository} GoalStationsRepositoryのインスタンス
     */
    static getGoalStationsRepository(): GoalStationsRepository {
        if (!this.goalStationsRepository) {
            this.goalStationsRepository = new GoalStationsRepository(prisma);
        }
        return this.goalStationsRepository;
    }

    /**
     * BombiiHistoriesRepositoryのインスタンスを取得（シングルトン）
     * @returns {BombiiHistoriesRepository} BombiiHistoriesRepositoryのインスタンス
     */
    static getBombiiHistoriesRepository(): BombiiHistoriesRepository {
        if (!this.bombiiHistoriesRepository) {
            this.bombiiHistoriesRepository = new BombiiHistoriesRepository(prisma);
        }
        return this.bombiiHistoriesRepository;
    }

    /**
     * EventsRepositoryのインスタンスを取得（シングルトン）
     * @returns {EventsRepository} EventsRepositoryのインスタンス
     */
    static getEventsRepository(): EventsRepository {
        if (!this.eventsRepository) {
            this.eventsRepository = new EventsRepository(prisma);
        }
        return this.eventsRepository;
    }

    /**
     * EventTypesRepositoryのインスタンスを取得（シングルトン）
     * @returns {EventTypesRepository} EventTypesRepositoryのインスタンス
     */
    static getEventTypesRepository(): EventTypesRepository {
        if (!this.eventTypesRepository) {
            this.eventTypesRepository = new EventTypesRepository(prisma);
        }
        return this.eventTypesRepository;
    }

    /**
     * StationsRepositoryのインスタンスを取得（シングルトン）
     * @returns {StationsRepository} StationsRepositoryのインスタンス
     */
    static getStationsRepository(): StationsRepository {
        if (!this.stationsRepository) {
            this.stationsRepository = new StationsRepository(prisma);
        }
        return this.stationsRepository;
    }

    /**
     * NearbyStationsRepositoryのインスタンスを取得（シングルトン）
     * @returns {NearbyStationsRepository} NearbyStationsRepositoryのインスタンス
     */
    static getNearbyStationsRepository(): NearbyStationsRepository {
        if (!this.nearbyStationsRepository) {
            this.nearbyStationsRepository = new NearbyStationsRepository(prisma);
        }
        return this.nearbyStationsRepository;
    }

    /**
     * TransitStationsRepositoryのインスタンスを取得（シングルトン）
     * @returns {TransitStationsRepository} TransitStationsRepositoryのインスタンス
     */
    static getTransitStationsRepository(): TransitStationsRepository {
        if (!this.transitStationsRepository) {
            this.transitStationsRepository = new TransitStationsRepository(prisma);
        }
        return this.transitStationsRepository;
    }

    /**
     * PointsRepositoryのインスタンスを取得（シングルトン）
     * @returns {PointsRepository} PointsRepositoryのインスタンス
     */
    static getPointsRepository(): PointsRepository {
        if (!this.pointsRepository) {
            this.pointsRepository = new PointsRepository(prisma);
        }
        return this.pointsRepository;
    }

    /**
     * すべてのRepositoryをリセット（主にテスト用）
     */
    static resetAll(): void {
        this.teamsRepository = null;
        this.goalStationsRepository = null;
        this.bombiiHistoriesRepository = null;
        this.eventsRepository = null;
        this.eventTypesRepository = null;
        this.stationsRepository = null;
        this.nearbyStationsRepository = null;
        this.transitStationsRepository = null;
        this.pointsRepository = null;
    }
}
