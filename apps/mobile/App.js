import React from "react";
import { SafeAreaView, StatusBar, StyleSheet, Text, View } from "react-native";

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>ب</Text>
          </View>

          <View>
            <Text style={styles.brand}>بازار</Text>
            <Text style={styles.subtitle}>بازار هوشمند محلی</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.badge}>بازار هوشمند محلی</Text>

          <Text style={styles.title}>
            هر چیزی که{"\n"}
            دنبالش هستی،{"\n"}
            همین اطرافه.
          </Text>

          <Text style={styles.description}>
            خرید، فروش، خدمات، کسب‌وکارها، کار، ملک و خودرو؛
            همه در یک بازار هوشمند و نزدیک به شما.
          </Text>

          <View style={styles.search}>
            <Text style={styles.searchIcon}>⌕</Text>
            <Text style={styles.searchText}>چی می‌خوای پیدا کنی؟</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionSmall}>موقعیت شما</Text>
          <Text style={styles.sectionTitle}>اطراف من</Text>

          <View style={styles.nearbyCard}>
            <Text style={styles.nearbyIcon}>📍</Text>

            <View style={styles.nearbyContent}>
              <Text style={styles.nearbyTitle}>
                چیزهای نزدیک شما را پیدا کنید
              </Text>

              <Text style={styles.nearbyText}>
                با فعال کردن موقعیت مکانی، آگهی‌ها و خدمات نزدیک خودتان را
                سریع‌تر پیدا کنید.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomNav}>
          <NavItem icon="⌂" title="خانه" active />
          <NavItem icon="▦" title="دسته‌ها" />
          <NavItem icon="⚡" title="خدمات" />
          <NavItem icon="🎁" title="کمپین‌ها" />
          <NavItem icon="☻" title="حساب من" />
        </View>

        <View style={styles.addButton}>
          <Text style={styles.addButtonText}>＋ ثبت</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function NavItem({ icon, title, active }) {
  return (
    <View style={[styles.navItem, active && styles.navItemActive]}>
      <Text style={styles.navIcon}>{icon}</Text>
      <Text style={[styles.navText, active && styles.navTextActive]}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f6f8fb"
  },

  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: "#f6f8fb"
  },

  header: {
    height: 75,
    flexDirection: "row",
    alignItems: "center",
    gap: 11
  },

  logo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#172033",
    alignItems: "center",
    justifyContent: "center"
  },

  logoText: {
    color: "#ffffff",
    fontSize: 23,
    fontWeight: "800"
  },

  brand: {
    fontSize: 21,
    fontWeight: "800",
    color: "#172033"
  },

  subtitle: {
    marginTop: 2,
    fontSize: 10,
    color: "#8791a4"
  },

  hero: {
    minHeight: 390,
    borderRadius: 26,
    padding: 25,
    backgroundColor: "#172033",
    justifyContent: "center"
  },

  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    color: "#ffffff",
    backgroundColor: "#303a4e",
    fontSize: 11,
    overflow: "hidden"
  },

  title: {
    marginTop: 21,
    color: "#ffffff",
    fontSize: 39,
    lineHeight: 48,
    fontWeight: "800"
  },

  description: {
    marginTop: 17,
    color: "#dce1ea",
    fontSize: 12,
    lineHeight: 23
  },

  search: {
    height: 55,
    marginTop: 24,
    borderRadius: 15,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14
  },

  searchIcon: {
    fontSize: 25,
    color: "#8791a4",
    marginRight: 8
  },

  searchText: {
    color: "#a2aaba",
    fontSize: 12
  },

  section: {
    marginTop: 30
  },

  sectionSmall: {
    color: "#8a94a7",
    fontSize: 11
  },

  sectionTitle: {
    marginTop: 4,
    color: "#172033",
    fontSize: 24,
    fontWeight: "800"
  },

  nearbyCard: {
    marginTop: 13,
    padding: 16,
    borderRadius: 19,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e6eaf0",
    flexDirection: "row",
    alignItems: "flex-start"
  },

  nearbyIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#f0f3f8",
    textAlign: "center",
    textAlignVertical: "center",
    fontSize: 22,
    marginRight: 12
  },

  nearbyContent: {
    flex: 1
  },

  nearbyTitle: {
    color: "#172033",
    fontSize: 13,
    fontWeight: "700"
  },

  nearbyText: {
    marginTop: 6,
    color: "#8993a5",
    fontSize: 10,
    lineHeight: 18
  },

  addButton: {
    position: "absolute",
    left: 20,
    bottom: 82,
    paddingHorizontal: 19,
    height: 47,
    borderRadius: 16,
    backgroundColor: "#172033",
    alignItems: "center",
    justifyContent: "center"
  },

  addButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700"
  },

  bottomNav: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 9,
    height: 65,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e9ef",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around"
  },

  navItem: {
    width: "19%",
    height: 54,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center"
  },

  navItemActive: {
    backgroundColor: "#f0f3f7"
  },

  navIcon: {
    color: "#8a94a7",
    fontSize: 17
  },

  navText: {
    marginTop: 3,
    color: "#8a94a7",
    fontSize: 9
  },

  navTextActive: {
    color: "#172033",
    fontWeight: "700"
  }
});
