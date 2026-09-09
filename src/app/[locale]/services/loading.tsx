'use client';
import { useSiteLocale } from '@/components/layout/locale-context';
import { Container } from '@/components/ui/primitives';
import styles from '@/app/states.module.css';
export default function Loading() {const {ui}=useSiteLocale();return <Container><div className={styles.loading} role="status"><p>{ui.loading}</p><div className={styles.skeleton} aria-hidden="true" /><div className={styles.skeletonSmall} aria-hidden="true" /></div></Container>;}
