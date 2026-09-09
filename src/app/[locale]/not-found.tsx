'use client';
import { Button, Container } from '@/components/ui/primitives';
import { useSiteLocale } from '@/components/layout/locale-context';
import { localizedPath } from '@/lib/urls';
import styles from '@/app/states.module.css';
export default function NotFound() { const {locale,ui}=useSiteLocale(); return <Container><section className={styles.state}><span className={styles.code} aria-hidden="true">404</span><h1>{ui.notFoundTitle}</h1><p>{ui.notFoundBody}</p><Button href={localizedPath(locale,'/services')}>{ui.allServices}</Button></section></Container>; }
