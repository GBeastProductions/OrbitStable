import cozyChristmasSceneImg from '../assets/images/skin_cozy_christmas_scene_1795711181962.jpg';
import krampusIronImg from '../assets/images/skin_krampus_iron_ornament_1795711184104.jpg';
import krampusnachtSceneImg from '../assets/images/skin_krampusnacht_scene_1795711182862.jpg';
import neonSakuraSceneImg from '../assets/images/skin_neon_sakura_scene_1795711180487.jpg';
import sakuraBranchImg from '../assets/images/skin_sakura_branch_ornament_1795711183094.jpg';
import { DevAssetItem } from '../types/game';
import { XMAS_SPRITES } from './christmasSprites';

const BASE = (import.meta as ImportMeta & { env?: { BASE_URL?: string } }).env?.BASE_URL || './';
const themeAssetUrl = (file: string) => `${BASE}assets/aistudio/ThemeAssets/${file}`;

export interface BuiltinStudioPng {
  id: string;
  name: string;
  pack: 'christmas' | 'krampus' | 'sakura' | 'backdrops';
  folder: 'ornaments' | 'themes' | 'overdrive';
  url: string;
}

export const BUILTIN_STUDIO_PNGS: BuiltinStudioPng[] = [
  // Cleaned Cozy Christmas 2026 PNG Sprites
  { id: 'builtin_xmas_logo_santa', name: 'xmas_logo_santa.png', pack: 'christmas', folder: 'ornaments', url: XMAS_SPRITES.logoSanta },
  { id: 'builtin_xmas_logo_ornate', name: 'xmas_logo_ornate.png', pack: 'christmas', folder: 'ornaments', url: XMAS_SPRITES.logoOrnate },
  { id: 'builtin_xmas_disc_gold', name: 'xmas_disc_gold.png', pack: 'christmas', folder: 'ornaments', url: XMAS_SPRITES.discGold },
  { id: 'builtin_xmas_bow_crimson', name: 'xmas_bow_crimson.png', pack: 'christmas', folder: 'ornaments', url: XMAS_SPRITES.bowCrimson },
  { id: 'builtin_xmas_bell_bow', name: 'xmas_bell_bow.png', pack: 'christmas', folder: 'ornaments', url: XMAS_SPRITES.bellBow },
  { id: 'builtin_xmas_bough_bell', name: 'xmas_bough_bell.png', pack: 'christmas', folder: 'ornaments', url: XMAS_SPRITES.boughBell },
  { id: 'builtin_xmas_holly_sprig', name: 'xmas_holly_sprig.png', pack: 'christmas', folder: 'ornaments', url: XMAS_SPRITES.hollySprig },
  { id: 'builtin_xmas_holly_bells', name: 'xmas_holly_bells.png', pack: 'christmas', folder: 'ornaments', url: XMAS_SPRITES.hollyBells },
  { id: 'builtin_xmas_wreath', name: 'xmas_wreath.png', pack: 'christmas', folder: 'ornaments', url: XMAS_SPRITES.wreath },
  { id: 'builtin_xmas_tree_ornate', name: 'xmas_tree_ornate.png', pack: 'christmas', folder: 'ornaments', url: XMAS_SPRITES.treeOrnate },
  { id: 'builtin_xmas_snowman_clean', name: 'xmas_snowman_clean.png', pack: 'christmas', folder: 'ornaments', url: XMAS_SPRITES.snowmanClean },
  { id: 'builtin_xmas_lantern', name: 'xmas_lantern.png', pack: 'christmas', folder: 'ornaments', url: XMAS_SPRITES.lantern },
  { id: 'builtin_xmas_gift_box', name: 'xmas_gift_box.png', pack: 'christmas', folder: 'ornaments', url: XMAS_SPRITES.giftBox },
  { id: 'builtin_xmas_gift_trio', name: 'xmas_gift_trio.png', pack: 'christmas', folder: 'ornaments', url: XMAS_SPRITES.giftTrio },
  { id: 'builtin_xmas_icicles', name: 'xmas_icicles.png', pack: 'christmas', folder: 'ornaments', url: XMAS_SPRITES.icicles },
  { id: 'builtin_xmas_snowdrift_bank', name: 'xmas_snowdrift_bank.png', pack: 'christmas', folder: 'ornaments', url: XMAS_SPRITES.snowdriftBank },
  { id: 'builtin_xmas_snowflake_ice', name: 'xmas_snowflake_ice.png', pack: 'christmas', folder: 'ornaments', url: XMAS_SPRITES.snowflakeIce },
  { id: 'builtin_xmas_snowflake_gold', name: 'xmas_snowflake_gold.png', pack: 'christmas', folder: 'overdrive', url: XMAS_SPRITES.snowflakeGold },
  { id: 'builtin_xmas_sparkle_gold', name: 'xmas_sparkle_gold.png', pack: 'christmas', folder: 'overdrive', url: XMAS_SPRITES.sparkleGold },
  { id: 'builtin_xmas_sparkle_red', name: 'xmas_sparkle_red.png', pack: 'christmas', folder: 'overdrive', url: XMAS_SPRITES.sparkleRed },
  { id: 'builtin_xmas_bar_crimson', name: 'xmas_bar_crimson.png', pack: 'christmas', folder: 'ornaments', url: XMAS_SPRITES.barCrimson },

  // Shared / Concept ThemeAssets PNGs
  { id: 'builtin_ta_gold_bells', name: '14_gold_bells.png', pack: 'christmas', folder: 'ornaments', url: themeAssetUrl('14_gold_bells.png') },
  { id: 'builtin_ta_snowy_cabin', name: '20_snowy_cabin_trees.png', pack: 'christmas', folder: 'themes', url: themeAssetUrl('20_snowy_cabin_trees.png') },
  { id: 'builtin_ta_wrapped_gifts_2', name: '21_wrapped_gifts.png', pack: 'christmas', folder: 'ornaments', url: themeAssetUrl('21_wrapped_gifts.png') },
  { id: 'builtin_ta_lantern_candles', name: '22_lantern_candles.png', pack: 'christmas', folder: 'ornaments', url: themeAssetUrl('22_lantern_candles.png') },
  { id: 'builtin_ta_krampus_logo', name: '01_orbit_krampus_logo.png', pack: 'krampus', folder: 'ornaments', url: themeAssetUrl('01_orbit_krampus_logo.png') },
  { id: 'builtin_ta_krampus_disc', name: '04_krampus_vinyl_disc.png', pack: 'krampus', folder: 'ornaments', url: themeAssetUrl('04_krampus_vinyl_disc.png') },
  { id: 'builtin_ta_krampus_chains', name: '15_hanging_chains.png', pack: 'krampus', folder: 'ornaments', url: themeAssetUrl('15_hanging_chains.png') },
  { id: 'builtin_ta_krampus_stars', name: '16_spiked_star_ornaments.png', pack: 'krampus', folder: 'overdrive', url: themeAssetUrl('16_spiked_star_ornaments.png') },
  { id: 'builtin_ta_krampus_figure', name: '19_krampus_figure.png', pack: 'krampus', folder: 'ornaments', url: themeAssetUrl('19_krampus_figure.png') },
  { id: 'builtin_ta_krampus_sparks', name: '23_red_glow_sparks.png', pack: 'krampus', folder: 'overdrive', url: themeAssetUrl('23_red_glow_sparks.png') },
  { id: 'builtin_ta_sakura_cluster', name: '14_sakura_blossom_cluster.png', pack: 'sakura', folder: 'ornaments', url: themeAssetUrl('14_sakura_blossom_cluster.png') },
  { id: 'builtin_ta_sakura_petals', name: '15_individual_sakura_petals.png', pack: 'sakura', folder: 'overdrive', url: themeAssetUrl('15_individual_sakura_petals.png') },
  { id: 'builtin_ta_sakura_flower', name: '16_large_sakura_flower.png', pack: 'sakura', folder: 'ornaments', url: themeAssetUrl('16_large_sakura_flower.png') },
  { id: 'builtin_ta_sakura_branch', name: '17_sakura_branch.png', pack: 'sakura', folder: 'ornaments', url: themeAssetUrl('17_sakura_branch.png') },
  { id: 'builtin_ta_torii_gate', name: '19_torii_gate.png', pack: 'sakura', folder: 'ornaments', url: themeAssetUrl('19_torii_gate.png') },
  { id: 'builtin_ta_full_moon', name: '20_full_moon.png', pack: 'sakura', folder: 'themes', url: themeAssetUrl('20_full_moon.png') },
  { id: 'builtin_ta_mount_fuji', name: '21_mount_fuji.png', pack: 'sakura', folder: 'themes', url: themeAssetUrl('21_mount_fuji.png') },
  { id: 'builtin_ta_pagodas', name: '22_japanese_torii_and_pagodas.png', pack: 'sakura', folder: 'themes', url: themeAssetUrl('22_japanese_torii_and_pagodas.png') },
  { id: 'builtin_ta_neon_sparkles', name: '23_neon_sparkles.png', pack: 'sakura', folder: 'overdrive', url: themeAssetUrl('23_neon_sparkles.png') },
  { id: 'builtin_ta_pink_clouds', name: '25_cloud_puffs.png', pack: 'sakura', folder: 'themes', url: themeAssetUrl('25_cloud_puffs.png') },

  // Built-in Scene Backdrops
  { id: 'builtin_bg_christmas', name: 'skin_cozy_christmas_scene.jpg', pack: 'backdrops', folder: 'themes', url: cozyChristmasSceneImg },
  { id: 'builtin_bg_krampus', name: 'skin_krampusnacht_scene.jpg', pack: 'backdrops', folder: 'themes', url: krampusnachtSceneImg },
  { id: 'builtin_bg_sakura', name: 'skin_neon_sakura_scene.jpg', pack: 'backdrops', folder: 'themes', url: neonSakuraSceneImg },
  { id: 'builtin_orn_sakura', name: 'skin_sakura_branch.jpg', pack: 'backdrops', folder: 'ornaments', url: sakuraBranchImg },
  { id: 'builtin_orn_krampus', name: 'skin_krampus_iron.jpg', pack: 'backdrops', folder: 'ornaments', url: krampusIronImg },
];

export function builtinPngToAssetItem(item: BuiltinStudioPng): DevAssetItem {
  return {
    id: item.id,
    status: 'published',
    name: item.name,
    folder: item.folder,
    kind: 'image',
    dataUrlOrPath: item.url,
    tags: [item.pack, 'builtin'],
  };
}
