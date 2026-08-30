CREATE TYPE "public"."incident_type" AS ENUM('vehicle_breakdown', 'temperature_excursion', 'traffic_delay', 'weather_delay', 'hub_congestion', 'customs_delay');--> statement-breakpoint
CREATE TYPE "public"."route_mode" AS ENUM('road_reefer', 'rail_cold_wagon', 'hub_transfer');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'business', 'agent');--> statement-breakpoint
CREATE TABLE "businesses" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"contact_info" text
);
--> statement-breakpoint
CREATE TABLE "cluster_shipments" (
	"cluster_id" varchar(255) NOT NULL,
	"shipment_id" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consolidation_clusters" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"cost_savings_percent" real NOT NULL,
	"co2_saved_kg" real NOT NULL,
	"status" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "delivery_routes" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"cluster_id" varchar(255),
	"status" varchar(50) NOT NULL,
	"total_cost" real NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incident_reports" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"shipment_id" varchar(255),
	"type" "incident_type" NOT NULL,
	"spoilage_risk_impact_hours" real NOT NULL,
	"status" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "route_legs" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"route_id" varchar(255) NOT NULL,
	"sequence" integer NOT NULL,
	"mode" "route_mode" NOT NULL,
	"origin" text NOT NULL,
	"destination" text NOT NULL,
	"reliability_score" real NOT NULL,
	"on_time_percent" real NOT NULL,
	"avg_delay_minutes" real NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipments" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"business_id" varchar(255) NOT NULL,
	"cargo_type" text NOT NULL,
	"target_temp_min" real NOT NULL,
	"target_temp_max" real NOT NULL,
	"current_temp" real NOT NULL,
	"total_shelf_life_hours" integer NOT NULL,
	"remaining_shelf_life_hours" integer NOT NULL,
	"freshness_percent" real NOT NULL,
	"sla_max_delivery_hours" integer,
	"sla_max_spoilage_percent" real,
	"sla_priority" varchar(50),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "temperature_log_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipment_id" varchar(255) NOT NULL,
	"timestamp" timestamp NOT NULL,
	"temp" real NOT NULL,
	"location" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" NOT NULL,
	"business_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "cluster_shipments" ADD CONSTRAINT "cluster_shipments_cluster_id_consolidation_clusters_id_fk" FOREIGN KEY ("cluster_id") REFERENCES "public"."consolidation_clusters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cluster_shipments" ADD CONSTRAINT "cluster_shipments_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_routes" ADD CONSTRAINT "delivery_routes_cluster_id_consolidation_clusters_id_fk" FOREIGN KEY ("cluster_id") REFERENCES "public"."consolidation_clusters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_reports" ADD CONSTRAINT "incident_reports_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_legs" ADD CONSTRAINT "route_legs_route_id_delivery_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."delivery_routes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "temperature_log_entries" ADD CONSTRAINT "temperature_log_entries_shipment_id_shipments_id_fk" FOREIGN KEY ("shipment_id") REFERENCES "public"."shipments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE no action ON UPDATE no action;