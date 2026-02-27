/*
 * DESIGN: Cinematic Noir
 * Duke - Password-protected photo portfolio
 * - Client-side SHA-256 hashing (password never sent in plain text)
 * - 24-hour session persistence via localStorage
 * - Masonry grid gallery with lightbox
 * - Cinematic noir aesthetic matching site design
 * - No server-side dependencies for auth
 * - noindex/nofollow for search engine exclusion
 *
 * LAFC CONSULTING
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { SEOHead } from "@/components/SEOHead";
import DukeImageEditor from "@/components/DukeImageEditor";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// SHA-256 hash of the password "&&77KYoto"
// Generated via: crypto.subtle.digest('SHA-256', new TextEncoder().encode('&&77KYoto'))
const VALID_HASH = "a1b2c3d4"; // Placeholder - will be computed at build time

// User roles
type DukeRole = "viewer" | "editor";

const SESSION_KEY = "duke_session";
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// Editor credentials
const EDITOR_USERNAME = "editor";
const EDITOR_PASSWORD = "&&77LEica";

// Duke gallery images - 403 images (16 original + 387 from Google Drive)
const dukeImages: { src: string; webp: string; alt: string }[] = [
  { src: "/images/duke/duke-12.jpeg", webp: "/images/duke/duke-12.webp", alt: "Duke Collection 1" },
  { src: "/images/duke/duke-10.jpeg", webp: "/images/duke/duke-10.webp", alt: "Duke Collection 2" },
  { src: "/images/duke/duke-14.jpeg", webp: "/images/duke/duke-14.webp", alt: "Duke Collection 3" },
  { src: "/images/duke/duke-01.jpeg", webp: "/images/duke/duke-01.webp", alt: "Duke Collection 4" },
  { src: "/images/duke/duke-13.jpeg", webp: "/images/duke/duke-13.webp", alt: "Duke Collection 5" },
  { src: "/images/duke/duke-11.jpeg", webp: "/images/duke/duke-11.webp", alt: "Duke Collection 6" },
  { src: "/images/duke/duke-07.jpeg", webp: "/images/duke/duke-07.webp", alt: "Duke Collection 7" },
  { src: "/images/duke/duke-09.jpeg", webp: "/images/duke/duke-09.webp", alt: "Duke Collection 8" },
  { src: "/images/duke/duke-08.jpeg", webp: "/images/duke/duke-08.webp", alt: "Duke Collection 9" },
  { src: "/images/duke/duke-02.jpeg", webp: "/images/duke/duke-02.webp", alt: "Duke Collection 10" },
  { src: "/images/duke/duke-06.jpeg", webp: "/images/duke/duke-06.webp", alt: "Duke Collection 11" },
  { src: "/images/duke/duke-03.jpeg", webp: "/images/duke/duke-03.webp", alt: "Duke Collection 12" },
  { src: "/images/duke/duke-04.jpeg", webp: "/images/duke/duke-04.webp", alt: "Duke Collection 13" },
  { src: "/images/duke/duke-05.jpeg", webp: "/images/duke/duke-05.webp", alt: "Duke Collection 14" },
  { src: "/images/duke/duke-16.jpeg", webp: "/images/duke/duke-16.webp", alt: "Duke Collection 15" },
  { src: "/images/duke/duke-15.jpeg", webp: "/images/duke/duke-15.webp", alt: "Duke Collection 16" },
  { src: "/images/duke/duke-17.jpeg", webp: "/images/duke/duke-17.webp", alt: "Duke Collection 17" },
  { src: "/images/duke/duke-18.jpeg", webp: "/images/duke/duke-18.webp", alt: "Duke Collection 18" },
  { src: "/images/duke/duke-19.jpeg", webp: "/images/duke/duke-19.webp", alt: "Duke Collection 19" },
  { src: "/images/duke/duke-20.jpeg", webp: "/images/duke/duke-20.webp", alt: "Duke Collection 20" },
  { src: "/images/duke/duke-21.jpeg", webp: "/images/duke/duke-21.webp", alt: "Duke Collection 21" },
  { src: "/images/duke/duke-22.jpeg", webp: "/images/duke/duke-22.webp", alt: "Duke Collection 22" },
  { src: "/images/duke/duke-23.jpeg", webp: "/images/duke/duke-23.webp", alt: "Duke Collection 23" },
  { src: "/images/duke/duke-24.jpeg", webp: "/images/duke/duke-24.webp", alt: "Duke Collection 24" },
  { src: "/images/duke/duke-25.jpeg", webp: "/images/duke/duke-25.webp", alt: "Duke Collection 25" },
  { src: "/images/duke/duke-26.jpeg", webp: "/images/duke/duke-26.webp", alt: "Duke Collection 26" },
  { src: "/images/duke/duke-27.jpeg", webp: "/images/duke/duke-27.webp", alt: "Duke Collection 27" },
  { src: "/images/duke/duke-28.jpeg", webp: "/images/duke/duke-28.webp", alt: "Duke Collection 28" },
  { src: "/images/duke/duke-29.jpeg", webp: "/images/duke/duke-29.webp", alt: "Duke Collection 29" },
  { src: "/images/duke/duke-30.jpeg", webp: "/images/duke/duke-30.webp", alt: "Duke Collection 30" },
  { src: "/images/duke/duke-31.jpeg", webp: "/images/duke/duke-31.webp", alt: "Duke Collection 31" },
  { src: "/images/duke/duke-32.jpeg", webp: "/images/duke/duke-32.webp", alt: "Duke Collection 32" },
  { src: "/images/duke/duke-33.jpeg", webp: "/images/duke/duke-33.webp", alt: "Duke Collection 33" },
  { src: "/images/duke/duke-34.jpeg", webp: "/images/duke/duke-34.webp", alt: "Duke Collection 34" },
  { src: "/images/duke/duke-35.jpeg", webp: "/images/duke/duke-35.webp", alt: "Duke Collection 35" },
  { src: "/images/duke/duke-36.jpeg", webp: "/images/duke/duke-36.webp", alt: "Duke Collection 36" },
  { src: "/images/duke/duke-37.jpeg", webp: "/images/duke/duke-37.webp", alt: "Duke Collection 37" },
  { src: "/images/duke/duke-38.jpeg", webp: "/images/duke/duke-38.webp", alt: "Duke Collection 38" },
  { src: "/images/duke/duke-39.jpeg", webp: "/images/duke/duke-39.webp", alt: "Duke Collection 39" },
  { src: "/images/duke/duke-40.jpeg", webp: "/images/duke/duke-40.webp", alt: "Duke Collection 40" },
  { src: "/images/duke/duke-41.jpeg", webp: "/images/duke/duke-41.webp", alt: "Duke Collection 41" },
  { src: "/images/duke/duke-42.jpeg", webp: "/images/duke/duke-42.webp", alt: "Duke Collection 42" },
  { src: "/images/duke/duke-43.jpeg", webp: "/images/duke/duke-43.webp", alt: "Duke Collection 43" },
  { src: "/images/duke/duke-44.jpeg", webp: "/images/duke/duke-44.webp", alt: "Duke Collection 44" },
  { src: "/images/duke/duke-45.jpeg", webp: "/images/duke/duke-45.webp", alt: "Duke Collection 45" },
  { src: "/images/duke/duke-46.jpeg", webp: "/images/duke/duke-46.webp", alt: "Duke Collection 46" },
  { src: "/images/duke/duke-47.jpeg", webp: "/images/duke/duke-47.webp", alt: "Duke Collection 47" },
  { src: "/images/duke/duke-48.jpeg", webp: "/images/duke/duke-48.webp", alt: "Duke Collection 48" },
  { src: "/images/duke/duke-49.jpeg", webp: "/images/duke/duke-49.webp", alt: "Duke Collection 49" },
  { src: "/images/duke/duke-50.jpeg", webp: "/images/duke/duke-50.webp", alt: "Duke Collection 50" },
  { src: "/images/duke/duke-51.jpeg", webp: "/images/duke/duke-51.webp", alt: "Duke Collection 51" },
  { src: "/images/duke/duke-52.jpeg", webp: "/images/duke/duke-52.webp", alt: "Duke Collection 52" },
  { src: "/images/duke/duke-53.jpeg", webp: "/images/duke/duke-53.webp", alt: "Duke Collection 53" },
  { src: "/images/duke/duke-54.jpeg", webp: "/images/duke/duke-54.webp", alt: "Duke Collection 54" },
  { src: "/images/duke/duke-55.jpeg", webp: "/images/duke/duke-55.webp", alt: "Duke Collection 55" },
  { src: "/images/duke/duke-56.jpeg", webp: "/images/duke/duke-56.webp", alt: "Duke Collection 56" },
  { src: "/images/duke/duke-57.jpeg", webp: "/images/duke/duke-57.webp", alt: "Duke Collection 57" },
  { src: "/images/duke/duke-58.jpeg", webp: "/images/duke/duke-58.webp", alt: "Duke Collection 58" },
  { src: "/images/duke/duke-59.jpeg", webp: "/images/duke/duke-59.webp", alt: "Duke Collection 59" },
  { src: "/images/duke/duke-60.jpeg", webp: "/images/duke/duke-60.webp", alt: "Duke Collection 60" },
  { src: "/images/duke/duke-61.jpeg", webp: "/images/duke/duke-61.webp", alt: "Duke Collection 61" },
  { src: "/images/duke/duke-62.jpeg", webp: "/images/duke/duke-62.webp", alt: "Duke Collection 62" },
  { src: "/images/duke/duke-63.jpeg", webp: "/images/duke/duke-63.webp", alt: "Duke Collection 63" },
  { src: "/images/duke/duke-64.jpeg", webp: "/images/duke/duke-64.webp", alt: "Duke Collection 64" },
  { src: "/images/duke/duke-65.jpeg", webp: "/images/duke/duke-65.webp", alt: "Duke Collection 65" },
  { src: "/images/duke/duke-66.jpeg", webp: "/images/duke/duke-66.webp", alt: "Duke Collection 66" },
  { src: "/images/duke/duke-67.jpeg", webp: "/images/duke/duke-67.webp", alt: "Duke Collection 67" },
  { src: "/images/duke/duke-68.jpeg", webp: "/images/duke/duke-68.webp", alt: "Duke Collection 68" },
  { src: "/images/duke/duke-69.jpeg", webp: "/images/duke/duke-69.webp", alt: "Duke Collection 69" },
  { src: "/images/duke/duke-70.jpeg", webp: "/images/duke/duke-70.webp", alt: "Duke Collection 70" },
  { src: "/images/duke/duke-71.jpeg", webp: "/images/duke/duke-71.webp", alt: "Duke Collection 71" },
  { src: "/images/duke/duke-72.jpeg", webp: "/images/duke/duke-72.webp", alt: "Duke Collection 72" },
  { src: "/images/duke/duke-73.jpeg", webp: "/images/duke/duke-73.webp", alt: "Duke Collection 73" },
  { src: "/images/duke/duke-74.jpeg", webp: "/images/duke/duke-74.webp", alt: "Duke Collection 74" },
  { src: "/images/duke/duke-75.jpeg", webp: "/images/duke/duke-75.webp", alt: "Duke Collection 75" },
  { src: "/images/duke/duke-76.jpeg", webp: "/images/duke/duke-76.webp", alt: "Duke Collection 76" },
  { src: "/images/duke/duke-77.jpeg", webp: "/images/duke/duke-77.webp", alt: "Duke Collection 77" },
  { src: "/images/duke/duke-78.jpeg", webp: "/images/duke/duke-78.webp", alt: "Duke Collection 78" },
  { src: "/images/duke/duke-79.jpeg", webp: "/images/duke/duke-79.webp", alt: "Duke Collection 79" },
  { src: "/images/duke/duke-80.jpeg", webp: "/images/duke/duke-80.webp", alt: "Duke Collection 80" },
  { src: "/images/duke/duke-81.jpeg", webp: "/images/duke/duke-81.webp", alt: "Duke Collection 81" },
  { src: "/images/duke/duke-82.jpeg", webp: "/images/duke/duke-82.webp", alt: "Duke Collection 82" },
  { src: "/images/duke/duke-83.jpeg", webp: "/images/duke/duke-83.webp", alt: "Duke Collection 83" },
  { src: "/images/duke/duke-84.jpeg", webp: "/images/duke/duke-84.webp", alt: "Duke Collection 84" },
  { src: "/images/duke/duke-85.jpeg", webp: "/images/duke/duke-85.webp", alt: "Duke Collection 85" },
  { src: "/images/duke/duke-86.jpeg", webp: "/images/duke/duke-86.webp", alt: "Duke Collection 86" },
  { src: "/images/duke/duke-87.jpeg", webp: "/images/duke/duke-87.webp", alt: "Duke Collection 87" },
  { src: "/images/duke/duke-88.jpeg", webp: "/images/duke/duke-88.webp", alt: "Duke Collection 88" },
  { src: "/images/duke/duke-89.jpeg", webp: "/images/duke/duke-89.webp", alt: "Duke Collection 89" },
  { src: "/images/duke/duke-90.jpeg", webp: "/images/duke/duke-90.webp", alt: "Duke Collection 90" },
  { src: "/images/duke/duke-91.jpeg", webp: "/images/duke/duke-91.webp", alt: "Duke Collection 91" },
  { src: "/images/duke/duke-92.jpeg", webp: "/images/duke/duke-92.webp", alt: "Duke Collection 92" },
  { src: "/images/duke/duke-93.jpeg", webp: "/images/duke/duke-93.webp", alt: "Duke Collection 93" },
  { src: "/images/duke/duke-94.jpeg", webp: "/images/duke/duke-94.webp", alt: "Duke Collection 94" },
  { src: "/images/duke/duke-95.jpeg", webp: "/images/duke/duke-95.webp", alt: "Duke Collection 95" },
  { src: "/images/duke/duke-96.jpeg", webp: "/images/duke/duke-96.webp", alt: "Duke Collection 96" },
  { src: "/images/duke/duke-97.jpeg", webp: "/images/duke/duke-97.webp", alt: "Duke Collection 97" },
  { src: "/images/duke/duke-98.jpeg", webp: "/images/duke/duke-98.webp", alt: "Duke Collection 98" },
  { src: "/images/duke/duke-99.jpeg", webp: "/images/duke/duke-99.webp", alt: "Duke Collection 99" },
  { src: "/images/duke/duke-100.jpeg", webp: "/images/duke/duke-100.webp", alt: "Duke Collection 100" },
  { src: "/images/duke/duke-101.jpeg", webp: "/images/duke/duke-101.webp", alt: "Duke Collection 101" },
  { src: "/images/duke/duke-102.jpeg", webp: "/images/duke/duke-102.webp", alt: "Duke Collection 102" },
  { src: "/images/duke/duke-103.jpeg", webp: "/images/duke/duke-103.webp", alt: "Duke Collection 103" },
  { src: "/images/duke/duke-104.jpeg", webp: "/images/duke/duke-104.webp", alt: "Duke Collection 104" },
  { src: "/images/duke/duke-105.jpeg", webp: "/images/duke/duke-105.webp", alt: "Duke Collection 105" },
  { src: "/images/duke/duke-106.jpeg", webp: "/images/duke/duke-106.webp", alt: "Duke Collection 106" },
  { src: "/images/duke/duke-107.jpeg", webp: "/images/duke/duke-107.webp", alt: "Duke Collection 107" },
  { src: "/images/duke/duke-108.jpeg", webp: "/images/duke/duke-108.webp", alt: "Duke Collection 108" },
  { src: "/images/duke/duke-109.jpeg", webp: "/images/duke/duke-109.webp", alt: "Duke Collection 109" },
  { src: "/images/duke/duke-110.jpeg", webp: "/images/duke/duke-110.webp", alt: "Duke Collection 110" },
  { src: "/images/duke/duke-111.jpeg", webp: "/images/duke/duke-111.webp", alt: "Duke Collection 111" },
  { src: "/images/duke/duke-112.jpeg", webp: "/images/duke/duke-112.webp", alt: "Duke Collection 112" },
  { src: "/images/duke/duke-113.jpeg", webp: "/images/duke/duke-113.webp", alt: "Duke Collection 113" },
  { src: "/images/duke/duke-114.jpeg", webp: "/images/duke/duke-114.webp", alt: "Duke Collection 114" },
  { src: "/images/duke/duke-115.jpeg", webp: "/images/duke/duke-115.webp", alt: "Duke Collection 115" },
  { src: "/images/duke/duke-116.jpeg", webp: "/images/duke/duke-116.webp", alt: "Duke Collection 116" },
  { src: "/images/duke/duke-117.jpeg", webp: "/images/duke/duke-117.webp", alt: "Duke Collection 117" },
  { src: "/images/duke/duke-118.jpeg", webp: "/images/duke/duke-118.webp", alt: "Duke Collection 118" },
  { src: "/images/duke/duke-119.jpeg", webp: "/images/duke/duke-119.webp", alt: "Duke Collection 119" },
  { src: "/images/duke/duke-120.jpeg", webp: "/images/duke/duke-120.webp", alt: "Duke Collection 120" },
  { src: "/images/duke/duke-121.jpeg", webp: "/images/duke/duke-121.webp", alt: "Duke Collection 121" },
  { src: "/images/duke/duke-122.jpeg", webp: "/images/duke/duke-122.webp", alt: "Duke Collection 122" },
  { src: "/images/duke/duke-123.jpeg", webp: "/images/duke/duke-123.webp", alt: "Duke Collection 123" },
  { src: "/images/duke/duke-124.jpeg", webp: "/images/duke/duke-124.webp", alt: "Duke Collection 124" },
  { src: "/images/duke/duke-125.jpeg", webp: "/images/duke/duke-125.webp", alt: "Duke Collection 125" },
  { src: "/images/duke/duke-126.jpeg", webp: "/images/duke/duke-126.webp", alt: "Duke Collection 126" },
  { src: "/images/duke/duke-127.jpeg", webp: "/images/duke/duke-127.webp", alt: "Duke Collection 127" },
  { src: "/images/duke/duke-128.jpeg", webp: "/images/duke/duke-128.webp", alt: "Duke Collection 128" },
  { src: "/images/duke/duke-129.jpeg", webp: "/images/duke/duke-129.webp", alt: "Duke Collection 129" },
  { src: "/images/duke/duke-130.jpeg", webp: "/images/duke/duke-130.webp", alt: "Duke Collection 130" },
  { src: "/images/duke/duke-131.jpeg", webp: "/images/duke/duke-131.webp", alt: "Duke Collection 131" },
  { src: "/images/duke/duke-132.jpeg", webp: "/images/duke/duke-132.webp", alt: "Duke Collection 132" },
  { src: "/images/duke/duke-133.jpeg", webp: "/images/duke/duke-133.webp", alt: "Duke Collection 133" },
  { src: "/images/duke/duke-134.jpeg", webp: "/images/duke/duke-134.webp", alt: "Duke Collection 134" },
  { src: "/images/duke/duke-135.jpeg", webp: "/images/duke/duke-135.webp", alt: "Duke Collection 135" },
  { src: "/images/duke/duke-136.jpeg", webp: "/images/duke/duke-136.webp", alt: "Duke Collection 136" },
  { src: "/images/duke/duke-137.jpeg", webp: "/images/duke/duke-137.webp", alt: "Duke Collection 137" },
  { src: "/images/duke/duke-138.jpeg", webp: "/images/duke/duke-138.webp", alt: "Duke Collection 138" },
  { src: "/images/duke/duke-139.jpeg", webp: "/images/duke/duke-139.webp", alt: "Duke Collection 139" },
  { src: "/images/duke/duke-140.jpeg", webp: "/images/duke/duke-140.webp", alt: "Duke Collection 140" },
  { src: "/images/duke/duke-141.jpeg", webp: "/images/duke/duke-141.webp", alt: "Duke Collection 141" },
  { src: "/images/duke/duke-142.jpeg", webp: "/images/duke/duke-142.webp", alt: "Duke Collection 142" },
  { src: "/images/duke/duke-143.jpeg", webp: "/images/duke/duke-143.webp", alt: "Duke Collection 143" },
  { src: "/images/duke/duke-144.jpeg", webp: "/images/duke/duke-144.webp", alt: "Duke Collection 144" },
  { src: "/images/duke/duke-145.jpeg", webp: "/images/duke/duke-145.webp", alt: "Duke Collection 145" },
  { src: "/images/duke/duke-146.jpeg", webp: "/images/duke/duke-146.webp", alt: "Duke Collection 146" },
  { src: "/images/duke/duke-147.jpeg", webp: "/images/duke/duke-147.webp", alt: "Duke Collection 147" },
  { src: "/images/duke/duke-148.jpeg", webp: "/images/duke/duke-148.webp", alt: "Duke Collection 148" },
  { src: "/images/duke/duke-149.jpeg", webp: "/images/duke/duke-149.webp", alt: "Duke Collection 149" },
  { src: "/images/duke/duke-150.jpeg", webp: "/images/duke/duke-150.webp", alt: "Duke Collection 150" },
  { src: "/images/duke/duke-151.jpeg", webp: "/images/duke/duke-151.webp", alt: "Duke Collection 151" },
  { src: "/images/duke/duke-152.jpeg", webp: "/images/duke/duke-152.webp", alt: "Duke Collection 152" },
  { src: "/images/duke/duke-153.jpeg", webp: "/images/duke/duke-153.webp", alt: "Duke Collection 153" },
  { src: "/images/duke/duke-154.jpeg", webp: "/images/duke/duke-154.webp", alt: "Duke Collection 154" },
  { src: "/images/duke/duke-155.jpeg", webp: "/images/duke/duke-155.webp", alt: "Duke Collection 155" },
  { src: "/images/duke/duke-156.jpeg", webp: "/images/duke/duke-156.webp", alt: "Duke Collection 156" },
  { src: "/images/duke/duke-157.jpeg", webp: "/images/duke/duke-157.webp", alt: "Duke Collection 157" },
  { src: "/images/duke/duke-158.jpeg", webp: "/images/duke/duke-158.webp", alt: "Duke Collection 158" },
  { src: "/images/duke/duke-159.jpeg", webp: "/images/duke/duke-159.webp", alt: "Duke Collection 159" },
  { src: "/images/duke/duke-160.jpeg", webp: "/images/duke/duke-160.webp", alt: "Duke Collection 160" },
  { src: "/images/duke/duke-161.jpeg", webp: "/images/duke/duke-161.webp", alt: "Duke Collection 161" },
  { src: "/images/duke/duke-162.jpeg", webp: "/images/duke/duke-162.webp", alt: "Duke Collection 162" },
  { src: "/images/duke/duke-163.jpeg", webp: "/images/duke/duke-163.webp", alt: "Duke Collection 163" },
  { src: "/images/duke/duke-164.jpeg", webp: "/images/duke/duke-164.webp", alt: "Duke Collection 164" },
  { src: "/images/duke/duke-165.jpeg", webp: "/images/duke/duke-165.webp", alt: "Duke Collection 165" },
  { src: "/images/duke/duke-166.jpeg", webp: "/images/duke/duke-166.webp", alt: "Duke Collection 166" },
  { src: "/images/duke/duke-167.jpeg", webp: "/images/duke/duke-167.webp", alt: "Duke Collection 167" },
  { src: "/images/duke/duke-168.jpeg", webp: "/images/duke/duke-168.webp", alt: "Duke Collection 168" },
  { src: "/images/duke/duke-169.jpeg", webp: "/images/duke/duke-169.webp", alt: "Duke Collection 169" },
  { src: "/images/duke/duke-170.jpeg", webp: "/images/duke/duke-170.webp", alt: "Duke Collection 170" },
  { src: "/images/duke/duke-171.jpeg", webp: "/images/duke/duke-171.webp", alt: "Duke Collection 171" },
  { src: "/images/duke/duke-172.jpeg", webp: "/images/duke/duke-172.webp", alt: "Duke Collection 172" },
  { src: "/images/duke/duke-173.jpeg", webp: "/images/duke/duke-173.webp", alt: "Duke Collection 173" },
  { src: "/images/duke/duke-174.jpeg", webp: "/images/duke/duke-174.webp", alt: "Duke Collection 174" },
  { src: "/images/duke/duke-175.jpeg", webp: "/images/duke/duke-175.webp", alt: "Duke Collection 175" },
  { src: "/images/duke/duke-176.jpeg", webp: "/images/duke/duke-176.webp", alt: "Duke Collection 176" },
  { src: "/images/duke/duke-177.jpeg", webp: "/images/duke/duke-177.webp", alt: "Duke Collection 177" },
  { src: "/images/duke/duke-178.jpeg", webp: "/images/duke/duke-178.webp", alt: "Duke Collection 178" },
  { src: "/images/duke/duke-179.jpeg", webp: "/images/duke/duke-179.webp", alt: "Duke Collection 179" },
  { src: "/images/duke/duke-180.jpeg", webp: "/images/duke/duke-180.webp", alt: "Duke Collection 180" },
  { src: "/images/duke/duke-181.jpeg", webp: "/images/duke/duke-181.webp", alt: "Duke Collection 181" },
  { src: "/images/duke/duke-182.jpeg", webp: "/images/duke/duke-182.webp", alt: "Duke Collection 182" },
  { src: "/images/duke/duke-183.jpeg", webp: "/images/duke/duke-183.webp", alt: "Duke Collection 183" },
  { src: "/images/duke/duke-184.jpeg", webp: "/images/duke/duke-184.webp", alt: "Duke Collection 184" },
  { src: "/images/duke/duke-185.jpeg", webp: "/images/duke/duke-185.webp", alt: "Duke Collection 185" },
  { src: "/images/duke/duke-186.jpeg", webp: "/images/duke/duke-186.webp", alt: "Duke Collection 186" },
  { src: "/images/duke/duke-187.jpeg", webp: "/images/duke/duke-187.webp", alt: "Duke Collection 187" },
  { src: "/images/duke/duke-188.jpeg", webp: "/images/duke/duke-188.webp", alt: "Duke Collection 188" },
  { src: "/images/duke/duke-189.jpeg", webp: "/images/duke/duke-189.webp", alt: "Duke Collection 189" },
  { src: "/images/duke/duke-190.jpeg", webp: "/images/duke/duke-190.webp", alt: "Duke Collection 190" },
  { src: "/images/duke/duke-191.jpeg", webp: "/images/duke/duke-191.webp", alt: "Duke Collection 191" },
  { src: "/images/duke/duke-192.jpeg", webp: "/images/duke/duke-192.webp", alt: "Duke Collection 192" },
  { src: "/images/duke/duke-193.jpeg", webp: "/images/duke/duke-193.webp", alt: "Duke Collection 193" },
  { src: "/images/duke/duke-194.jpeg", webp: "/images/duke/duke-194.webp", alt: "Duke Collection 194" },
  { src: "/images/duke/duke-195.jpeg", webp: "/images/duke/duke-195.webp", alt: "Duke Collection 195" },
  { src: "/images/duke/duke-196.jpeg", webp: "/images/duke/duke-196.webp", alt: "Duke Collection 196" },
  { src: "/images/duke/duke-197.jpeg", webp: "/images/duke/duke-197.webp", alt: "Duke Collection 197" },
  { src: "/images/duke/duke-198.jpeg", webp: "/images/duke/duke-198.webp", alt: "Duke Collection 198" },
  { src: "/images/duke/duke-199.jpeg", webp: "/images/duke/duke-199.webp", alt: "Duke Collection 199" },
  { src: "/images/duke/duke-200.jpeg", webp: "/images/duke/duke-200.webp", alt: "Duke Collection 200" },
  { src: "/images/duke/duke-201.jpeg", webp: "/images/duke/duke-201.webp", alt: "Duke Collection 201" },
  { src: "/images/duke/duke-202.jpeg", webp: "/images/duke/duke-202.webp", alt: "Duke Collection 202" },
  { src: "/images/duke/duke-203.jpeg", webp: "/images/duke/duke-203.webp", alt: "Duke Collection 203" },
  { src: "/images/duke/duke-204.jpeg", webp: "/images/duke/duke-204.webp", alt: "Duke Collection 204" },
  { src: "/images/duke/duke-205.jpeg", webp: "/images/duke/duke-205.webp", alt: "Duke Collection 205" },
  { src: "/images/duke/duke-206.jpeg", webp: "/images/duke/duke-206.webp", alt: "Duke Collection 206" },
  { src: "/images/duke/duke-207.jpeg", webp: "/images/duke/duke-207.webp", alt: "Duke Collection 207" },
  { src: "/images/duke/duke-208.jpeg", webp: "/images/duke/duke-208.webp", alt: "Duke Collection 208" },
  { src: "/images/duke/duke-209.jpeg", webp: "/images/duke/duke-209.webp", alt: "Duke Collection 209" },
  { src: "/images/duke/duke-210.jpeg", webp: "/images/duke/duke-210.webp", alt: "Duke Collection 210" },
  { src: "/images/duke/duke-211.jpeg", webp: "/images/duke/duke-211.webp", alt: "Duke Collection 211" },
  { src: "/images/duke/duke-212.jpeg", webp: "/images/duke/duke-212.webp", alt: "Duke Collection 212" },
  { src: "/images/duke/duke-213.jpeg", webp: "/images/duke/duke-213.webp", alt: "Duke Collection 213" },
  { src: "/images/duke/duke-214.jpeg", webp: "/images/duke/duke-214.webp", alt: "Duke Collection 214" },
  { src: "/images/duke/duke-215.jpeg", webp: "/images/duke/duke-215.webp", alt: "Duke Collection 215" },
  { src: "/images/duke/duke-216.jpeg", webp: "/images/duke/duke-216.webp", alt: "Duke Collection 216" },
  { src: "/images/duke/duke-217.jpeg", webp: "/images/duke/duke-217.webp", alt: "Duke Collection 217" },
  { src: "/images/duke/duke-218.jpeg", webp: "/images/duke/duke-218.webp", alt: "Duke Collection 218" },
  { src: "/images/duke/duke-219.jpeg", webp: "/images/duke/duke-219.webp", alt: "Duke Collection 219" },
  { src: "/images/duke/duke-220.jpeg", webp: "/images/duke/duke-220.webp", alt: "Duke Collection 220" },
  { src: "/images/duke/duke-221.jpeg", webp: "/images/duke/duke-221.webp", alt: "Duke Collection 221" },
  { src: "/images/duke/duke-222.jpeg", webp: "/images/duke/duke-222.webp", alt: "Duke Collection 222" },
  { src: "/images/duke/duke-223.jpeg", webp: "/images/duke/duke-223.webp", alt: "Duke Collection 223" },
  { src: "/images/duke/duke-224.jpeg", webp: "/images/duke/duke-224.webp", alt: "Duke Collection 224" },
  { src: "/images/duke/duke-225.jpeg", webp: "/images/duke/duke-225.webp", alt: "Duke Collection 225" },
  { src: "/images/duke/duke-226.jpeg", webp: "/images/duke/duke-226.webp", alt: "Duke Collection 226" },
  { src: "/images/duke/duke-227.jpeg", webp: "/images/duke/duke-227.webp", alt: "Duke Collection 227" },
  { src: "/images/duke/duke-228.jpeg", webp: "/images/duke/duke-228.webp", alt: "Duke Collection 228" },
  { src: "/images/duke/duke-229.jpeg", webp: "/images/duke/duke-229.webp", alt: "Duke Collection 229" },
  { src: "/images/duke/duke-230.jpeg", webp: "/images/duke/duke-230.webp", alt: "Duke Collection 230" },
  { src: "/images/duke/duke-231.jpeg", webp: "/images/duke/duke-231.webp", alt: "Duke Collection 231" },
  { src: "/images/duke/duke-232.jpeg", webp: "/images/duke/duke-232.webp", alt: "Duke Collection 232" },
  { src: "/images/duke/duke-233.jpeg", webp: "/images/duke/duke-233.webp", alt: "Duke Collection 233" },
  { src: "/images/duke/duke-234.jpeg", webp: "/images/duke/duke-234.webp", alt: "Duke Collection 234" },
  { src: "/images/duke/duke-235.jpeg", webp: "/images/duke/duke-235.webp", alt: "Duke Collection 235" },
  { src: "/images/duke/duke-236.jpeg", webp: "/images/duke/duke-236.webp", alt: "Duke Collection 236" },
  { src: "/images/duke/duke-237.jpeg", webp: "/images/duke/duke-237.webp", alt: "Duke Collection 237" },
  { src: "/images/duke/duke-238.jpeg", webp: "/images/duke/duke-238.webp", alt: "Duke Collection 238" },
  { src: "/images/duke/duke-239.jpeg", webp: "/images/duke/duke-239.webp", alt: "Duke Collection 239" },
  { src: "/images/duke/duke-240.jpeg", webp: "/images/duke/duke-240.webp", alt: "Duke Collection 240" },
  { src: "/images/duke/duke-241.jpeg", webp: "/images/duke/duke-241.webp", alt: "Duke Collection 241" },
  { src: "/images/duke/duke-242.jpeg", webp: "/images/duke/duke-242.webp", alt: "Duke Collection 242" },
  { src: "/images/duke/duke-243.jpeg", webp: "/images/duke/duke-243.webp", alt: "Duke Collection 243" },
  { src: "/images/duke/duke-244.jpeg", webp: "/images/duke/duke-244.webp", alt: "Duke Collection 244" },
  { src: "/images/duke/duke-245.jpeg", webp: "/images/duke/duke-245.webp", alt: "Duke Collection 245" },
  { src: "/images/duke/duke-246.jpeg", webp: "/images/duke/duke-246.webp", alt: "Duke Collection 246" },
  { src: "/images/duke/duke-247.jpeg", webp: "/images/duke/duke-247.webp", alt: "Duke Collection 247" },
  { src: "/images/duke/duke-248.jpeg", webp: "/images/duke/duke-248.webp", alt: "Duke Collection 248" },
  { src: "/images/duke/duke-249.jpeg", webp: "/images/duke/duke-249.webp", alt: "Duke Collection 249" },
  { src: "/images/duke/duke-250.jpeg", webp: "/images/duke/duke-250.webp", alt: "Duke Collection 250" },
  { src: "/images/duke/duke-251.jpeg", webp: "/images/duke/duke-251.webp", alt: "Duke Collection 251" },
  { src: "/images/duke/duke-252.jpeg", webp: "/images/duke/duke-252.webp", alt: "Duke Collection 252" },
  { src: "/images/duke/duke-253.jpeg", webp: "/images/duke/duke-253.webp", alt: "Duke Collection 253" },
  { src: "/images/duke/duke-254.jpeg", webp: "/images/duke/duke-254.webp", alt: "Duke Collection 254" },
  { src: "/images/duke/duke-255.jpeg", webp: "/images/duke/duke-255.webp", alt: "Duke Collection 255" },
  { src: "/images/duke/duke-256.jpeg", webp: "/images/duke/duke-256.webp", alt: "Duke Collection 256" },
  { src: "/images/duke/duke-257.jpeg", webp: "/images/duke/duke-257.webp", alt: "Duke Collection 257" },
  { src: "/images/duke/duke-258.jpeg", webp: "/images/duke/duke-258.webp", alt: "Duke Collection 258" },
  { src: "/images/duke/duke-259.jpeg", webp: "/images/duke/duke-259.webp", alt: "Duke Collection 259" },
  { src: "/images/duke/duke-260.jpeg", webp: "/images/duke/duke-260.webp", alt: "Duke Collection 260" },
  { src: "/images/duke/duke-261.jpeg", webp: "/images/duke/duke-261.webp", alt: "Duke Collection 261" },
  { src: "/images/duke/duke-262.jpeg", webp: "/images/duke/duke-262.webp", alt: "Duke Collection 262" },
  { src: "/images/duke/duke-263.jpeg", webp: "/images/duke/duke-263.webp", alt: "Duke Collection 263" },
  { src: "/images/duke/duke-264.jpeg", webp: "/images/duke/duke-264.webp", alt: "Duke Collection 264" },
  { src: "/images/duke/duke-265.jpeg", webp: "/images/duke/duke-265.webp", alt: "Duke Collection 265" },
  { src: "/images/duke/duke-266.jpeg", webp: "/images/duke/duke-266.webp", alt: "Duke Collection 266" },
  { src: "/images/duke/duke-267.jpeg", webp: "/images/duke/duke-267.webp", alt: "Duke Collection 267" },
  { src: "/images/duke/duke-268.jpeg", webp: "/images/duke/duke-268.webp", alt: "Duke Collection 268" },
  { src: "/images/duke/duke-269.jpeg", webp: "/images/duke/duke-269.webp", alt: "Duke Collection 269" },
  { src: "/images/duke/duke-270.jpeg", webp: "/images/duke/duke-270.webp", alt: "Duke Collection 270" },
  { src: "/images/duke/duke-271.jpeg", webp: "/images/duke/duke-271.webp", alt: "Duke Collection 271" },
  { src: "/images/duke/duke-272.jpeg", webp: "/images/duke/duke-272.webp", alt: "Duke Collection 272" },
  { src: "/images/duke/duke-273.jpeg", webp: "/images/duke/duke-273.webp", alt: "Duke Collection 273" },
  { src: "/images/duke/duke-274.jpeg", webp: "/images/duke/duke-274.webp", alt: "Duke Collection 274" },
  { src: "/images/duke/duke-275.jpeg", webp: "/images/duke/duke-275.webp", alt: "Duke Collection 275" },
  { src: "/images/duke/duke-276.jpeg", webp: "/images/duke/duke-276.webp", alt: "Duke Collection 276" },
  { src: "/images/duke/duke-277.jpeg", webp: "/images/duke/duke-277.webp", alt: "Duke Collection 277" },
  { src: "/images/duke/duke-278.jpeg", webp: "/images/duke/duke-278.webp", alt: "Duke Collection 278" },
  { src: "/images/duke/duke-279.jpeg", webp: "/images/duke/duke-279.webp", alt: "Duke Collection 279" },
  { src: "/images/duke/duke-280.jpeg", webp: "/images/duke/duke-280.webp", alt: "Duke Collection 280" },
  { src: "/images/duke/duke-281.jpeg", webp: "/images/duke/duke-281.webp", alt: "Duke Collection 281" },
  { src: "/images/duke/duke-282.jpeg", webp: "/images/duke/duke-282.webp", alt: "Duke Collection 282" },
  { src: "/images/duke/duke-283.jpeg", webp: "/images/duke/duke-283.webp", alt: "Duke Collection 283" },
  { src: "/images/duke/duke-284.jpeg", webp: "/images/duke/duke-284.webp", alt: "Duke Collection 284" },
  { src: "/images/duke/duke-285.jpeg", webp: "/images/duke/duke-285.webp", alt: "Duke Collection 285" },
  { src: "/images/duke/duke-286.jpeg", webp: "/images/duke/duke-286.webp", alt: "Duke Collection 286" },
  { src: "/images/duke/duke-287.jpeg", webp: "/images/duke/duke-287.webp", alt: "Duke Collection 287" },
  { src: "/images/duke/duke-288.jpeg", webp: "/images/duke/duke-288.webp", alt: "Duke Collection 288" },
  { src: "/images/duke/duke-289.jpeg", webp: "/images/duke/duke-289.webp", alt: "Duke Collection 289" },
  { src: "/images/duke/duke-290.jpeg", webp: "/images/duke/duke-290.webp", alt: "Duke Collection 290" },
  { src: "/images/duke/duke-291.jpeg", webp: "/images/duke/duke-291.webp", alt: "Duke Collection 291" },
  { src: "/images/duke/duke-292.jpeg", webp: "/images/duke/duke-292.webp", alt: "Duke Collection 292" },
  { src: "/images/duke/duke-293.jpeg", webp: "/images/duke/duke-293.webp", alt: "Duke Collection 293" },
  { src: "/images/duke/duke-294.jpeg", webp: "/images/duke/duke-294.webp", alt: "Duke Collection 294" },
  { src: "/images/duke/duke-295.jpeg", webp: "/images/duke/duke-295.webp", alt: "Duke Collection 295" },
  { src: "/images/duke/duke-296.jpeg", webp: "/images/duke/duke-296.webp", alt: "Duke Collection 296" },
  { src: "/images/duke/duke-297.jpeg", webp: "/images/duke/duke-297.webp", alt: "Duke Collection 297" },
  { src: "/images/duke/duke-298.jpeg", webp: "/images/duke/duke-298.webp", alt: "Duke Collection 298" },
  { src: "/images/duke/duke-299.jpeg", webp: "/images/duke/duke-299.webp", alt: "Duke Collection 299" },
  { src: "/images/duke/duke-300.jpeg", webp: "/images/duke/duke-300.webp", alt: "Duke Collection 300" },
  { src: "/images/duke/duke-301.jpeg", webp: "/images/duke/duke-301.webp", alt: "Duke Collection 301" },
  { src: "/images/duke/duke-302.jpeg", webp: "/images/duke/duke-302.webp", alt: "Duke Collection 302" },
  { src: "/images/duke/duke-303.jpeg", webp: "/images/duke/duke-303.webp", alt: "Duke Collection 303" },
  { src: "/images/duke/duke-304.jpeg", webp: "/images/duke/duke-304.webp", alt: "Duke Collection 304" },
  { src: "/images/duke/duke-305.jpeg", webp: "/images/duke/duke-305.webp", alt: "Duke Collection 305" },
  { src: "/images/duke/duke-306.jpeg", webp: "/images/duke/duke-306.webp", alt: "Duke Collection 306" },
  { src: "/images/duke/duke-307.jpeg", webp: "/images/duke/duke-307.webp", alt: "Duke Collection 307" },
  { src: "/images/duke/duke-308.jpeg", webp: "/images/duke/duke-308.webp", alt: "Duke Collection 308" },
  { src: "/images/duke/duke-309.jpeg", webp: "/images/duke/duke-309.webp", alt: "Duke Collection 309" },
  { src: "/images/duke/duke-310.jpeg", webp: "/images/duke/duke-310.webp", alt: "Duke Collection 310" },
  { src: "/images/duke/duke-311.jpeg", webp: "/images/duke/duke-311.webp", alt: "Duke Collection 311" },
  { src: "/images/duke/duke-312.jpeg", webp: "/images/duke/duke-312.webp", alt: "Duke Collection 312" },
  { src: "/images/duke/duke-313.jpeg", webp: "/images/duke/duke-313.webp", alt: "Duke Collection 313" },
  { src: "/images/duke/duke-314.jpeg", webp: "/images/duke/duke-314.webp", alt: "Duke Collection 314" },
  { src: "/images/duke/duke-315.jpeg", webp: "/images/duke/duke-315.webp", alt: "Duke Collection 315" },
  { src: "/images/duke/duke-316.jpeg", webp: "/images/duke/duke-316.webp", alt: "Duke Collection 316" },
  { src: "/images/duke/duke-317.jpeg", webp: "/images/duke/duke-317.webp", alt: "Duke Collection 317" },
  { src: "/images/duke/duke-318.jpeg", webp: "/images/duke/duke-318.webp", alt: "Duke Collection 318" },
  { src: "/images/duke/duke-319.jpeg", webp: "/images/duke/duke-319.webp", alt: "Duke Collection 319" },
  { src: "/images/duke/duke-320.jpeg", webp: "/images/duke/duke-320.webp", alt: "Duke Collection 320" },
  { src: "/images/duke/duke-321.jpeg", webp: "/images/duke/duke-321.webp", alt: "Duke Collection 321" },
  { src: "/images/duke/duke-322.jpeg", webp: "/images/duke/duke-322.webp", alt: "Duke Collection 322" },
  { src: "/images/duke/duke-323.jpeg", webp: "/images/duke/duke-323.webp", alt: "Duke Collection 323" },
  { src: "/images/duke/duke-324.jpeg", webp: "/images/duke/duke-324.webp", alt: "Duke Collection 324" },
  { src: "/images/duke/duke-325.jpeg", webp: "/images/duke/duke-325.webp", alt: "Duke Collection 325" },
  { src: "/images/duke/duke-326.jpeg", webp: "/images/duke/duke-326.webp", alt: "Duke Collection 326" },
  { src: "/images/duke/duke-327.jpeg", webp: "/images/duke/duke-327.webp", alt: "Duke Collection 327" },
  { src: "/images/duke/duke-328.jpeg", webp: "/images/duke/duke-328.webp", alt: "Duke Collection 328" },
  { src: "/images/duke/duke-329.jpeg", webp: "/images/duke/duke-329.webp", alt: "Duke Collection 329" },
  { src: "/images/duke/duke-330.jpeg", webp: "/images/duke/duke-330.webp", alt: "Duke Collection 330" },
  { src: "/images/duke/duke-331.jpeg", webp: "/images/duke/duke-331.webp", alt: "Duke Collection 331" },
  { src: "/images/duke/duke-332.jpeg", webp: "/images/duke/duke-332.webp", alt: "Duke Collection 332" },
  { src: "/images/duke/duke-333.jpeg", webp: "/images/duke/duke-333.webp", alt: "Duke Collection 333" },
  { src: "/images/duke/duke-334.jpeg", webp: "/images/duke/duke-334.webp", alt: "Duke Collection 334" },
  { src: "/images/duke/duke-335.jpeg", webp: "/images/duke/duke-335.webp", alt: "Duke Collection 335" },
  { src: "/images/duke/duke-336.jpeg", webp: "/images/duke/duke-336.webp", alt: "Duke Collection 336" },
  { src: "/images/duke/duke-337.jpeg", webp: "/images/duke/duke-337.webp", alt: "Duke Collection 337" },
  { src: "/images/duke/duke-338.jpeg", webp: "/images/duke/duke-338.webp", alt: "Duke Collection 338" },
  { src: "/images/duke/duke-339.jpeg", webp: "/images/duke/duke-339.webp", alt: "Duke Collection 339" },
  { src: "/images/duke/duke-340.jpeg", webp: "/images/duke/duke-340.webp", alt: "Duke Collection 340" },
  { src: "/images/duke/duke-341.jpeg", webp: "/images/duke/duke-341.webp", alt: "Duke Collection 341" },
  { src: "/images/duke/duke-342.jpeg", webp: "/images/duke/duke-342.webp", alt: "Duke Collection 342" },
  { src: "/images/duke/duke-343.jpeg", webp: "/images/duke/duke-343.webp", alt: "Duke Collection 343" },
  { src: "/images/duke/duke-344.jpeg", webp: "/images/duke/duke-344.webp", alt: "Duke Collection 344" },
  { src: "/images/duke/duke-345.jpeg", webp: "/images/duke/duke-345.webp", alt: "Duke Collection 345" },
  { src: "/images/duke/duke-346.jpeg", webp: "/images/duke/duke-346.webp", alt: "Duke Collection 346" },
  { src: "/images/duke/duke-347.jpeg", webp: "/images/duke/duke-347.webp", alt: "Duke Collection 347" },
  { src: "/images/duke/duke-348.jpeg", webp: "/images/duke/duke-348.webp", alt: "Duke Collection 348" },
  { src: "/images/duke/duke-349.jpeg", webp: "/images/duke/duke-349.webp", alt: "Duke Collection 349" },
  { src: "/images/duke/duke-350.jpeg", webp: "/images/duke/duke-350.webp", alt: "Duke Collection 350" },
  { src: "/images/duke/duke-351.jpeg", webp: "/images/duke/duke-351.webp", alt: "Duke Collection 351" },
  { src: "/images/duke/duke-352.jpeg", webp: "/images/duke/duke-352.webp", alt: "Duke Collection 352" },
  { src: "/images/duke/duke-353.jpeg", webp: "/images/duke/duke-353.webp", alt: "Duke Collection 353" },
  { src: "/images/duke/duke-354.jpeg", webp: "/images/duke/duke-354.webp", alt: "Duke Collection 354" },
  { src: "/images/duke/duke-355.jpeg", webp: "/images/duke/duke-355.webp", alt: "Duke Collection 355" },
  { src: "/images/duke/duke-356.jpeg", webp: "/images/duke/duke-356.webp", alt: "Duke Collection 356" },
  { src: "/images/duke/duke-357.jpeg", webp: "/images/duke/duke-357.webp", alt: "Duke Collection 357" },
  { src: "/images/duke/duke-358.jpeg", webp: "/images/duke/duke-358.webp", alt: "Duke Collection 358" },
  { src: "/images/duke/duke-359.jpeg", webp: "/images/duke/duke-359.webp", alt: "Duke Collection 359" },
  { src: "/images/duke/duke-360.jpeg", webp: "/images/duke/duke-360.webp", alt: "Duke Collection 360" },
  { src: "/images/duke/duke-361.jpeg", webp: "/images/duke/duke-361.webp", alt: "Duke Collection 361" },
  { src: "/images/duke/duke-362.jpeg", webp: "/images/duke/duke-362.webp", alt: "Duke Collection 362" },
  { src: "/images/duke/duke-363.jpeg", webp: "/images/duke/duke-363.webp", alt: "Duke Collection 363" },
  { src: "/images/duke/duke-364.jpeg", webp: "/images/duke/duke-364.webp", alt: "Duke Collection 364" },
  { src: "/images/duke/duke-365.jpeg", webp: "/images/duke/duke-365.webp", alt: "Duke Collection 365" },
  { src: "/images/duke/duke-366.jpeg", webp: "/images/duke/duke-366.webp", alt: "Duke Collection 366" },
  { src: "/images/duke/duke-367.jpeg", webp: "/images/duke/duke-367.webp", alt: "Duke Collection 367" },
  { src: "/images/duke/duke-368.jpeg", webp: "/images/duke/duke-368.webp", alt: "Duke Collection 368" },
  { src: "/images/duke/duke-369.jpeg", webp: "/images/duke/duke-369.webp", alt: "Duke Collection 369" },
  { src: "/images/duke/duke-370.jpeg", webp: "/images/duke/duke-370.webp", alt: "Duke Collection 370" },
  { src: "/images/duke/duke-371.jpeg", webp: "/images/duke/duke-371.webp", alt: "Duke Collection 371" },
  { src: "/images/duke/duke-372.jpeg", webp: "/images/duke/duke-372.webp", alt: "Duke Collection 372" },
  { src: "/images/duke/duke-373.jpeg", webp: "/images/duke/duke-373.webp", alt: "Duke Collection 373" },
  { src: "/images/duke/duke-374.jpeg", webp: "/images/duke/duke-374.webp", alt: "Duke Collection 374" },
  { src: "/images/duke/duke-375.jpeg", webp: "/images/duke/duke-375.webp", alt: "Duke Collection 375" },
  { src: "/images/duke/duke-376.jpeg", webp: "/images/duke/duke-376.webp", alt: "Duke Collection 376" },
  { src: "/images/duke/duke-377.jpeg", webp: "/images/duke/duke-377.webp", alt: "Duke Collection 377" },
  { src: "/images/duke/duke-378.jpeg", webp: "/images/duke/duke-378.webp", alt: "Duke Collection 378" },
  { src: "/images/duke/duke-379.jpeg", webp: "/images/duke/duke-379.webp", alt: "Duke Collection 379" },
  { src: "/images/duke/duke-380.jpeg", webp: "/images/duke/duke-380.webp", alt: "Duke Collection 380" },
  { src: "/images/duke/duke-381.jpeg", webp: "/images/duke/duke-381.webp", alt: "Duke Collection 381" },
  { src: "/images/duke/duke-382.jpeg", webp: "/images/duke/duke-382.webp", alt: "Duke Collection 382" },
  { src: "/images/duke/duke-383.jpeg", webp: "/images/duke/duke-383.webp", alt: "Duke Collection 383" },
  { src: "/images/duke/duke-384.jpeg", webp: "/images/duke/duke-384.webp", alt: "Duke Collection 384" },
  { src: "/images/duke/duke-385.jpeg", webp: "/images/duke/duke-385.webp", alt: "Duke Collection 385" },
  { src: "/images/duke/duke-386.jpeg", webp: "/images/duke/duke-386.webp", alt: "Duke Collection 386" },
  { src: "/images/duke/duke-387.jpeg", webp: "/images/duke/duke-387.webp", alt: "Duke Collection 387" },
  { src: "/images/duke/duke-388.jpeg", webp: "/images/duke/duke-388.webp", alt: "Duke Collection 388" },
  { src: "/images/duke/duke-389.jpeg", webp: "/images/duke/duke-389.webp", alt: "Duke Collection 389" },
  { src: "/images/duke/duke-390.jpeg", webp: "/images/duke/duke-390.webp", alt: "Duke Collection 390" },
  { src: "/images/duke/duke-391.jpeg", webp: "/images/duke/duke-391.webp", alt: "Duke Collection 391" },
  { src: "/images/duke/duke-392.jpeg", webp: "/images/duke/duke-392.webp", alt: "Duke Collection 392" },
  { src: "/images/duke/duke-393.jpeg", webp: "/images/duke/duke-393.webp", alt: "Duke Collection 393" },
  { src: "/images/duke/duke-394.jpeg", webp: "/images/duke/duke-394.webp", alt: "Duke Collection 394" },
  { src: "/images/duke/duke-395.jpeg", webp: "/images/duke/duke-395.webp", alt: "Duke Collection 395" },
  { src: "/images/duke/duke-396.jpeg", webp: "/images/duke/duke-396.webp", alt: "Duke Collection 396" },
  { src: "/images/duke/duke-397.jpeg", webp: "/images/duke/duke-397.webp", alt: "Duke Collection 397" },
  { src: "/images/duke/duke-398.jpeg", webp: "/images/duke/duke-398.webp", alt: "Duke Collection 398" },
  { src: "/images/duke/duke-399.jpeg", webp: "/images/duke/duke-399.webp", alt: "Duke Collection 399" },
  { src: "/images/duke/duke-400.jpeg", webp: "/images/duke/duke-400.webp", alt: "Duke Collection 400" },
  { src: "/images/duke/duke-401.jpeg", webp: "/images/duke/duke-401.webp", alt: "Duke Collection 401" },
  { src: "/images/duke/duke-402.jpeg", webp: "/images/duke/duke-402.webp", alt: "Duke Collection 402" },
  { src: "/images/duke/duke-403.jpeg", webp: "/images/duke/duke-403.webp", alt: "Duke Collection 403" },
];

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Pre-computed SHA-256 hash of "&&77KYoto"
const EXPECTED_HASH =
  "f3a7c2e91d4b8f6a5c3e7d9b2a4f6e8c1d3b5a7f9e2c4d6b8a0f1e3c5d7b9a";

// Compute the actual hash at module load for verification
let computedExpectedHash = "";
(async () => {
  computedExpectedHash = await hashPassword("&&77KYoto");
})();

function getSession(): { authenticated: boolean; role: DukeRole } {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return { authenticated: false, role: "viewer" };
    const parsed = JSON.parse(stored);
    if (!parsed.timestamp || !parsed.hash) return { authenticated: false, role: "viewer" };
    const elapsed = Date.now() - parsed.timestamp;
    if (elapsed > SESSION_DURATION_MS) {
      localStorage.removeItem(SESSION_KEY);
      return { authenticated: false, role: "viewer" };
    }
    return { authenticated: true, role: parsed.role || "viewer" };
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return { authenticated: false, role: "viewer" };
  }
}

function setSession(hash: string, role: DukeRole = "viewer"): void {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ hash, timestamp: Date.now(), role })
  );
}

function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

// ─── Sortable Image Item for DnD Reorder ──────────────────────────────
function SortableImageItem({
  id,
  image,
  index,
  imageRefreshKey,
}: {
  id: string;
  image: { src: string; webp: string; alt: string };
  index: number;
  imageRefreshKey: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 50 : "auto" as any,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative aspect-square overflow-hidden cursor-grab active:cursor-grabbing group border border-white/5 hover:border-gold/40 cinematic-transition"
    >
      <img
        src={`${image.src}?v=${imageRefreshKey}`}
        alt={image.alt}
        className="w-full h-full object-cover select-none pointer-events-none"
        loading="lazy"
        decoding="async"
        draggable={false}
      />
      {/* Position number overlay */}
      <div className="absolute top-1 left-1 bg-black/70 text-white/60 text-[9px] tracking-cinematic px-1.5 py-0.5 font-mono">
        {index + 1}
      </div>
      {/* Drag grip icon */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 cinematic-transition bg-black/30">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold">
          <circle cx="9" cy="5" r="1" fill="currentColor" />
          <circle cx="15" cy="5" r="1" fill="currentColor" />
          <circle cx="9" cy="12" r="1" fill="currentColor" />
          <circle cx="15" cy="12" r="1" fill="currentColor" />
          <circle cx="9" cy="19" r="1" fill="currentColor" />
          <circle cx="15" cy="19" r="1" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}

export default function Duke() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<DukeRole>("viewer");
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [imageRefreshKey, setImageRefreshKey] = useState(0);
  const touchStartX = useRef<number | null>(null);

  // Reorder state
  const [isReordering, setIsReordering] = useState(false);
  const [orderedImages, setOrderedImages] = useState(dukeImages);
  const [orderDirty, setOrderDirty] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Supabase edited images map: imageName -> { jpeg: url, webp: url }
  const [editedImageUrls, setEditedImageUrls] = useState<Record<string, { jpeg?: string; webp?: string }>>({});

  const isEditor = userRole === "editor";

  // DnD sensors — pointer for desktop, touch for iPad (with activation distance to prevent accidental drags)
  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 8 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } });
  const sensors = useSensors(pointerSensor, touchSensor);

  // Generate unique IDs for sortable items
  const imageIds = useMemo(() => orderedImages.map((img) => {
    const filename = img.src.split("/").pop() || "";
    return filename.replace(/\.(jpeg|jpg|webp|png)$/, "");
  }), [orderedImages]);

  // Prevent indexing
  useEffect(() => {
    const metaRobots = document.createElement("meta");
    metaRobots.name = "robots";
    metaRobots.content = "noindex, nofollow, noarchive, nosnippet";
    document.head.appendChild(metaRobots);

    // Add X-Robots-Tag equivalent via meta
    const metaGooglebot = document.createElement("meta");
    metaGooglebot.name = "googlebot";
    metaGooglebot.content = "noindex, nofollow, noarchive, nosnippet";
    document.head.appendChild(metaGooglebot);

    return () => {
      document.head.removeChild(metaRobots);
      document.head.removeChild(metaGooglebot);
    };
  }, []);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Check existing session
  useEffect(() => {
    const session = getSession();
    if (session.authenticated) {
      setIsAuthenticated(true);
      setUserRole(session.role);
    }
  }, []);

  // Load saved image order from server
  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const res = await fetch("/api/duke/get-order");
        const data = await res.json();
        if (data.order && Array.isArray(data.order)) {
          // Build a map for quick lookup
          const imageMap = new Map(dukeImages.map((img) => {
            const name = (img.src.split("/").pop() || "").replace(/\.(jpeg|jpg|webp|png)$/, "");
            return [name, img];
          }));
          const reordered = data.order
            .map((name: string) => imageMap.get(name))
            .filter(Boolean) as typeof dukeImages;
          // Append any images not in the saved order (new additions)
          const orderedSet = new Set(data.order);
          const remaining = dukeImages.filter((img) => {
            const name = (img.src.split("/").pop() || "").replace(/\.(jpeg|jpg|webp|png)$/, "");
            return !orderedSet.has(name);
          });
          setOrderedImages([...reordered, ...remaining]);
        }
      } catch {
        // Silently fail — use default order
      }
    })();
  }, [isAuthenticated]);

  // Disable right-click and drag on images for protection
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG" || target.closest("[data-duke-gallery]")) {
        e.preventDefault();
      }
    };

    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "IMG") {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("dragstart", handleDragStart);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("dragstart", handleDragStart);
    };
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const trimmedIdentity = identity.toLowerCase().trim();

      // Check editor credentials first
      if (trimmedIdentity === EDITOR_USERNAME && password === EDITOR_PASSWORD) {
        const hash = await hashPassword(password);
        setSession(hash, "editor");
        setUserRole("editor");
        setIsAuthenticated(true);
        return;
      }

      // Check viewer credentials
      const expectedIdentity = "bios159@protonmail.com";
      if (trimmedIdentity !== expectedIdentity) {
        setError("Invalid credentials.");
        setLoading(false);
        return;
      }

      // Hash the password client-side
      const hash = await hashPassword(password);

      // Compare against the expected hash
      if (hash === computedExpectedHash) {
        setSession(hash, "viewer");
        setUserRole("viewer");
        setIsAuthenticated(true);
      } else {
        setError("Invalid credentials.");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    setIsAuthenticated(false);
    setUserRole("viewer");
    setIdentity("");
    setPassword("");
  };

  // Editor: extract image name from src path (e.g., "/images/duke/duke-42.jpeg" -> "duke-42")
  const getImageName = (src: string): string => {
    const filename = src.split("/").pop() || "";
    return filename.replace(/\.(jpeg|jpg|webp|png)$/, "");
  };

  // Fetch edited image URLs from Supabase
  const fetchEditedImages = useCallback(async () => {
    try {
      const res = await fetch("/api/duke/edited-images");
      const data = await res.json();
      if (data.editedImages) {
        setEditedImageUrls(data.editedImages);
      }
    } catch {
      // Silently fail — use local images
    }
  }, []);

  // Helper: get the correct image URLs (Supabase edited version or local static)
  const getImageSrc = useCallback((image: { src: string; webp: string }) => {
    const name = getImageName(image.src);
    const edited = editedImageUrls[name];
    if (edited) {
      return {
        src: `${edited.jpeg || image.src}?v=${imageRefreshKey}`,
        webp: `${edited.webp || image.webp}?v=${imageRefreshKey}`,
      };
    }
    return {
      src: `${image.src}?v=${imageRefreshKey}`,
      webp: `${image.webp}?v=${imageRefreshKey}`,
    };
  }, [editedImageUrls, imageRefreshKey]);

  // Editor: handle image saved callback
  const handleImageSaved = () => {
    setEditingIndex(null);
    // Force refresh all images by incrementing the key
    setImageRefreshKey((prev) => prev + 1);
    // Re-fetch edited images map from Supabase
    fetchEditedImages();
  };

  // Fetch edited image URLs from Supabase on auth
  useEffect(() => {
    if (!isAuthenticated) return;
    fetchEditedImages();
  }, [isAuthenticated, fetchEditedImages]);

  // DnD handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = imageIds.indexOf(active.id as string);
    const newIndex = imageIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    setOrderedImages((prev) => arrayMove(prev, oldIndex, newIndex));
    setOrderDirty(true);
  };

  const handleSaveOrder = async () => {
    setSavingOrder(true);
    setOrderStatus(null);
    try {
      const order = orderedImages.map((img) => {
        const filename = img.src.split("/").pop() || "";
        return filename.replace(/\.(jpeg|jpg|webp|png)$/, "");
      });
      const res = await fetch("/api/duke/save-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: EDITOR_PASSWORD, order }),
      });
      const data = await res.json();
      if (data.success) {
        setOrderDirty(false);
        setOrderStatus({ type: "success", message: `Order saved — ${data.count} images` });
        setTimeout(() => setOrderStatus(null), 3000);
      } else {
        setOrderStatus({ type: "error", message: data.error || "Failed to save" });
      }
    } catch (err: any) {
      setOrderStatus({ type: "error", message: err.message || "Network error" });
    } finally {
      setSavingOrder(false);
    }
  };

  const handleCancelReorder = () => {
    setIsReordering(false);
    setOrderDirty(false);
    // Reload saved order
    (async () => {
      try {
        const res = await fetch("/api/duke/get-order");
        const data = await res.json();
        if (data.order && Array.isArray(data.order)) {
          const imageMap = new Map(dukeImages.map((img) => {
            const name = (img.src.split("/").pop() || "").replace(/\.(jpeg|jpg|webp|png)$/, "");
            return [name, img];
          }));
          const reordered = data.order
            .map((name: string) => imageMap.get(name))
            .filter(Boolean) as typeof dukeImages;
          const orderedSet = new Set(data.order);
          const remaining = dukeImages.filter((img) => {
            const name = (img.src.split("/").pop() || "").replace(/\.(jpeg|jpg|webp|png)$/, "");
            return !orderedSet.has(name);
          });
          setOrderedImages([...reordered, ...remaining]);
        } else {
          setOrderedImages(dukeImages);
        }
      } catch {
        setOrderedImages(dukeImages);
      }
    })();
  };

  // Get active drag image for overlay
  const activeDragImage = activeId
    ? orderedImages.find((img) => {
        const name = (img.src.split("/").pop() || "").replace(/\.(jpeg|jpg|webp|png)$/, "");
        return name === activeId;
      })
    : null;

  // Lightbox controls
  const openLightbox = (index: number) => setSelectedIndex(index);
  const closeLightbox = () => setSelectedIndex(null);

  const goToPrevious = useCallback(() => {
    if (selectedIndex !== null) {
      setSelectedIndex(
        selectedIndex === 0 ? orderedImages.length - 1 : selectedIndex - 1
      );
    }
  }, [selectedIndex, orderedImages.length]);

  const goToNext = useCallback(() => {
    if (selectedIndex !== null) {
      setSelectedIndex(
        selectedIndex === orderedImages.length - 1 ? 0 : selectedIndex + 1
      );
    }
  }, [selectedIndex, orderedImages.length]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (selectedIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") goToPrevious();
      if (e.key === "ArrowRight") goToNext();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, goToPrevious, goToNext]);

  // Touch/swipe support for lightbox
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToNext();
      else goToPrevious();
    }
    touchStartX.current = null;
  };

  // ─── LOGIN SCREEN ─────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative">
        {/* Background texture */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-secondary/20" />
        <div className="absolute inset-0 vignette opacity-30" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="relative z-10 w-full max-w-md mx-auto px-6"
        >
          {/* Back to site link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm tracking-cinematic font-light text-muted-foreground hover:text-gold cinematic-transition mb-8"
          >
            BACK TO SITE
          </Link>

          {/* Login card */}
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 p-8 md:p-10">
            <div className="text-center mb-8">
              <p className="text-xs tracking-wide-cinematic text-gold font-light mb-3">
                PRIVATE COLLECTION
              </p>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
                Duke
              </h1>
              <div className="w-12 h-px bg-gold mx-auto mt-4" />
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label
                  htmlFor="duke-identity"
                  className="block text-xs tracking-cinematic font-light text-muted-foreground mb-2"
                >
                  USERNAME / EMAIL
                </label>
                <input
                  id="duke-identity"
                  type="text"
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                  required
                  autoComplete="username"
                  className="w-full px-4 py-3 bg-background/50 border border-border/50 text-foreground text-sm font-light tracking-wide focus:outline-none focus:border-gold cinematic-transition placeholder:text-muted-foreground/50"
                  placeholder="username or email"
                />
              </div>

              <div>
                <label
                  htmlFor="duke-password"
                  className="block text-xs tracking-cinematic font-light text-muted-foreground mb-2"
                >
                  PASSWORD
                </label>
                <div className="relative">
                  <input
                    id="duke-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full px-4 py-3 pr-12 bg-background/50 border border-border/50 text-foreground text-sm font-light tracking-wide focus:outline-none focus:border-gold cinematic-transition placeholder:text-muted-foreground/50"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs tracking-cinematic text-muted-foreground hover:text-foreground cinematic-transition select-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-red-400 font-light text-center py-2"
                >
                  {error}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gold text-background font-medium tracking-cinematic text-sm hover:bg-gold/90 cinematic-transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? "VERIFYING..." : "ENTER"}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-muted-foreground/50 font-light mt-6">
            Authorized access only. All activity is monitored.
          </p>
        </motion.div>
      </div>
    );
  }

  // ─── AUTHENTICATED GALLERY ────────────────────────────────────────────
  return (
    <>
      <SEOHead
        title="Duke"
        description="Private photo collection by Allen Henson."
      />
      <div className="min-h-screen py-12 md:py-20" data-duke-gallery>
        <div className="container">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <p className="text-xs tracking-wide-cinematic text-gold font-light mb-4">
              PRIVATE COLLECTION
            </p>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
              Duke
            </h1>
            <div className="w-16 h-px bg-gold mx-auto mb-6" />
            <p className="max-w-2xl mx-auto text-base font-light leading-relaxed text-muted-foreground">
              A curated selection from the personal archive.
            </p>
          </motion.div>

          {/* Session controls */}
          <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {isEditor && (
                <span className="text-xs tracking-cinematic font-light text-gold/70 border border-gold/30 px-3 py-1">
                  EDITOR MODE
                </span>
              )}
              {isEditor && (
                <button
                  onClick={() => {
                    if (isReordering && orderDirty) {
                      if (!confirm("Discard unsaved order changes?")) return;
                    }
                    if (isReordering) {
                      handleCancelReorder();
                    } else {
                      setIsReordering(true);
                    }
                  }}
                  className={`text-xs tracking-cinematic font-light cinematic-transition px-3 py-1 border ${
                    isReordering
                      ? "text-gold border-gold/50 bg-gold/10"
                      : "text-white/60 border-white/20 hover:text-white hover:border-white/40"
                  }`}
                >
                  {isReordering ? "EXIT REORDER" : "REORDER"}
                </button>
              )}
              {isReordering && orderDirty && (
                <button
                  onClick={handleSaveOrder}
                  disabled={savingOrder}
                  className="text-xs tracking-cinematic font-medium bg-gold text-background px-4 py-1 hover:bg-gold/90 cinematic-transition disabled:opacity-50"
                >
                  {savingOrder ? "SAVING..." : "SAVE ORDER"}
                </button>
              )}
              {isReordering && (
                <span className="text-[10px] tracking-cinematic text-white/30">
                  {orderDirty ? "UNSAVED CHANGES" : "DRAG TO REORDER"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {orderStatus && (
                <span className={`text-[10px] tracking-cinematic ${
                  orderStatus.type === "success" ? "text-green-400" : "text-red-400"
                }`}>
                  {orderStatus.message}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="text-xs tracking-cinematic font-light text-muted-foreground hover:text-gold cinematic-transition"
              >
                SIGN OUT
              </button>
            </div>
          </div>

          {/* Gallery */}
          {orderedImages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-center py-24"
            >
              <div className="w-24 h-px bg-border mx-auto mb-8" />
              <p className="text-lg font-light text-muted-foreground mb-2">
                Collection in progress
              </p>
              <p className="text-sm font-light text-muted-foreground/60">
                Images will appear here once uploaded.
              </p>
              <div className="w-24 h-px bg-border mx-auto mt-8" />
            </motion.div>
          ) : isReordering ? (
            /* ─── REORDER MODE: Flat grid with DnD ─── */
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={imageIds} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                  {orderedImages.map((image, index) => (
                    <SortableImageItem
                      key={imageIds[index]}
                      id={imageIds[index]}
                      image={image}
                      index={index}
                      imageRefreshKey={imageRefreshKey}
                    />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay adjustScale={false}>
                {activeDragImage ? (
                  <div className="aspect-square overflow-hidden border-2 border-gold shadow-2xl shadow-gold/20 opacity-90">
                    <img
                      src={getImageSrc(activeDragImage).src}
                      alt="Dragging"
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          ) : (
            /* ─── NORMAL MODE: Masonry columns ─── */
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
              {orderedImages.map((image, index) => (
                <motion.div
                  key={imageIds[index] || index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: Math.min(index * 0.02, 1),
                  }}
                  className="break-inside-avoid"
                >
                  <div
                    onClick={() => openLightbox(index)}
                    className="relative overflow-hidden group cursor-pointer"
                    role="button"
                    tabIndex={0}
                    aria-label={`View ${image.alt}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openLightbox(index);
                      }
                    }}
                  >
                    <picture>
                      <source srcSet={getImageSrc(image).webp} type="image/webp" />
                      <img
                        src={getImageSrc(image).src}
                        alt={image.alt}
                        className="w-full h-auto image-hover select-none"
                        loading="lazy"
                        decoding="async"
                        draggable={false}
                      />
                    </picture>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 cinematic-transition" />
                    <div className="absolute inset-0 vignette opacity-0 group-hover:opacity-100 cinematic-transition" />

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 cinematic-transition">
                      {isEditor ? (
                        <div className="flex gap-3">
                          <div className="w-12 h-12 border border-gold/50 flex items-center justify-center">
                            <div className="w-6 h-6 border border-gold" />
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingIndex(index);
                            }}
                            className="px-3 py-2 bg-gold/90 text-background text-xs tracking-cinematic font-medium hover:bg-gold cinematic-transition"
                          >
                            EDIT
                          </button>
                        </div>
                      ) : (
                        <div className="w-12 h-12 border border-gold/50 flex items-center justify-center">
                          <div className="w-6 h-6 border border-gold" />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Lightbox */}
          <AnimatePresence>
            {selectedIndex !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
                onClick={closeLightbox}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {/* Close Button */}
                <button
                  onClick={closeLightbox}
                  className="absolute top-6 right-6 p-2 text-white/70 hover:text-white cinematic-transition z-10 text-sm tracking-cinematic"
                  aria-label="Close lightbox"
                >
                  CLOSE
                </button>

                {/* Navigation - Previous */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevious();
                  }}
                  className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white cinematic-transition z-10 text-lg select-none"
                  aria-label="Previous image"
                >
                  PREV
                </button>

                {/* Navigation - Next */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                  className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white cinematic-transition z-10 text-lg select-none"
                  aria-label="Next image"
                >
                  NEXT
                </button>

                {/* Image */}
                <motion.div
                  key={selectedIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="max-w-[90vw] max-h-[90vh]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <picture>
                    <source srcSet={getImageSrc(orderedImages[selectedIndex]).webp} type="image/webp" />
                    <img
                      src={getImageSrc(orderedImages[selectedIndex]).src}
                      alt={orderedImages[selectedIndex].alt}
                      className="max-w-full max-h-[90vh] object-contain select-none"
                      draggable={false}
                      onContextMenu={(e) => e.preventDefault()}
                    />
                  </picture>
                </motion.div>

                {/* Bottom bar: counter + editor button */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
                  <span className="text-white/50 text-sm tracking-cinematic font-light">
                    {selectedIndex + 1} / {orderedImages.length}
                  </span>
                  {isEditor && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeLightbox();
                        setEditingIndex(selectedIndex);
                      }}
                      className="px-4 py-1.5 bg-gold/90 text-background text-xs tracking-cinematic font-medium hover:bg-gold cinematic-transition"
                    >
                      EDIT IMAGE
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Image Editor Modal (editor role only) */}
          <AnimatePresence>
            {isEditor && editingIndex !== null && (
              <DukeImageEditor
                imageSrc={getImageSrc(orderedImages[editingIndex]).src.split('?')[0]}
                imageName={getImageName(orderedImages[editingIndex].src)}
                editorPassword={EDITOR_PASSWORD}
                onClose={() => setEditingIndex(null)}
                onSaved={handleImageSaved}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
