use std::collections::{HashMap, VecDeque};
use std::time::{Duration, Instant};

#[derive(Clone)]
struct CacheEntry {
    value: String,
    expires_at: Instant,
}

pub struct LruTtlCache {
    map: HashMap<String, CacheEntry>,
    order: VecDeque<String>,
    capacity: usize,
    ttl: Duration,
}

impl LruTtlCache {
    pub fn new(capacity: usize, ttl_seconds: u64) -> Self {
        Self {
            map: HashMap::new(),
            order: VecDeque::new(),
            capacity,
            ttl: Duration::from_secs(ttl_seconds),
        }
    }

    pub fn get(&mut self, key: &str) -> Option<String> {
        self.evict_expired();

        if let Some(entry) = self.map.get(key).cloned() {
            if entry.expires_at < Instant::now() {
                self.remove(key);
                return None;
            }
            self.touch(key);
            return Some(entry.value);
        }

        None
    }

    pub fn put(&mut self, key: String, value: String) {
        self.evict_expired();

        let entry = CacheEntry {
            value,
            expires_at: Instant::now() + self.ttl,
        };

        if self.map.contains_key(&key) {
            self.map.insert(key.clone(), entry);
            self.touch(&key);
            return;
        }

        self.map.insert(key.clone(), entry);
        self.order.push_back(key);

        while self.map.len() > self.capacity {
            if let Some(oldest) = self.order.pop_front() {
                self.map.remove(&oldest);
            }
        }
    }

    pub fn len(&self) -> usize {
        self.map.len()
    }

    fn touch(&mut self, key: &str) {
        self.order.retain(|k| k != key);
        self.order.push_back(key.to_string());
    }

    fn remove(&mut self, key: &str) {
        self.map.remove(key);
        self.order.retain(|k| k != key);
    }

    fn evict_expired(&mut self) {
        let now = Instant::now();
        let keys_to_remove: Vec<String> = self
            .map
            .iter()
            .filter_map(|(k, v)| {
                if v.expires_at < now {
                    Some(k.clone())
                } else {
                    None
                }
            })
            .collect();

        for key in keys_to_remove {
            self.remove(&key);
        }
    }
}
