import numpy as np
import joblib
import os
from typing import Dict, Tuple, List
from collections import deque

class MLPredictor:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.is_loaded = False
        self.traffic_history = deque(maxlen=100)
        self.attack_labels = {0: 'normal', 1: 'data_exfiltration', 2: 'ddos', 3: 'ransomware'}
        self.load_model()
    
    def load_model(self):
        model_paths = ["/home/opp_env/default_workspace/MedicalIoTNetwork/python_ai/models/gradient_boosting_model.pkl"]
        scaler_paths = ["/home/opp_env/default_workspace/MedicalIoTNetwork/python_ai/models/scaler.pkl"]
        for path in model_paths:
            if os.path.exists(path):
                try:
                    self.model = joblib.load(path)
                    print(f"✅ Loaded model: {path}")
                    break
                except Exception as e:
                    print(f"❌ Model load error: {e}")
        for path in scaler_paths:
            if os.path.exists(path):
                try:
                    self.scaler = joblib.load(path)
                    print(f"✅ Loaded scaler: {path}")
                    break
                except Exception as e:
                    print(f"❌ Scaler load error: {e}")
        self.is_loaded = self.model is not None
        if not self.is_loaded:
            print("⚠️ Using rule-based detection")
    
    def predict(self, data: Dict) -> Tuple[str, float]:
        # Store history for anomaly detection
        self.traffic_history.append(data)
        
        if self.is_loaded:
            try:
                features = self._extract_features(data)
                if self.scaler:
                    features = self.scaler.transform(features)
                pred = self.model.predict(features)[0]
                conf = float(np.max(self.model.predict_proba(features)[0])) * 100 if hasattr(self.model, 'predict_proba') else 95.0
                return self.attack_labels.get(int(pred), 'normal'), conf
            except Exception as e:
                print(f"❌ Predict error: {e}")
        return self._rule_based(data)
    
    def _extract_features(self, data: Dict) -> np.ndarray:
        base = [data.get(k, 0) for k in ['total_packets', 'total_bytes', 'avg_packet_size', 'packet_rate', 'byte_rate', 'tcp_packets', 'udp_packets', 'icmp_packets', 'tcp_udp_ratio', 'avg_ttl', 'unique_src_ips', 'unique_dst_ips', 'unique_src_ports', 'unique_dst_ports', 'syn_count', 'ack_count', 'fin_count', 'rst_count', 'avg_tcp_window']]
        temporal = self._temporal()
        return np.array(base + temporal).reshape(1, -1)
    
    def _temporal(self) -> List[float]:
        if len(self.traffic_history) < 2:
            return [0.0] * 16
        pr = [h.get('packet_rate', 0) for h in self.traffic_history]
        ps = [h.get('avg_packet_size', 0) for h in self.traffic_history]
        return [np.mean(pr), np.std(pr), np.min(pr), np.max(pr), np.mean(ps), np.std(ps), np.min(ps), np.max(ps), 0, 0, 0, 0, pr[-1]-pr[-2], 0, np.mean(pr)*np.mean(ps), np.std(pr)/np.mean(pr) if np.mean(pr)>0 else 0]
    
    def _rule_based(self, data: Dict) -> Tuple[str, float]:
        packet_rate = data.get('packet_rate', 0)
        byte_rate = data.get('byte_rate', 0)
        syn_count = data.get('syn_count', 0)
        rst_count = data.get('rst_count', 0)
        total_packets = data.get('total_packets', 0)
        avg_packet_size = data.get('avg_packet_size', 0)
        unique_dst_ips = data.get('unique_dst_ips', 0)
        unique_dst_ports = data.get('unique_dst_ports', 0)
        tcp_packets = data.get('tcp_packets', 0)
        udp_packets = data.get('udp_packets', 0)
        
        # Calculate anomaly scores
        anomaly_score = 0
        attack_type = 'normal'
        
        # DDoS Detection - HIGH packet rate, HIGH SYN count
        # Thresholds lowered for aggregated traffic detection
        if packet_rate > 500 or syn_count > 50 or total_packets > 5000:
            ddos_score = 0
            if packet_rate > 500: ddos_score += 30
            if packet_rate > 1000: ddos_score += 20
            if packet_rate > 2000: ddos_score += 20
            if syn_count > 50: ddos_score += 15
            if syn_count > 100: ddos_score += 15
            if total_packets > 5000: ddos_score += 10
            if udp_packets > tcp_packets * 2: ddos_score += 10
            
            if ddos_score > anomaly_score:
                anomaly_score = ddos_score
                attack_type = 'ddos'
        
        # Data Exfiltration - HIGH byte rate, LARGE packets, FEW destinations
        if byte_rate > 50000 or avg_packet_size > 1000:
            exfil_score = 0
            if byte_rate > 50000: exfil_score += 25
            if byte_rate > 100000: exfil_score += 20
            if byte_rate > 500000: exfil_score += 20
            if avg_packet_size > 1000: exfil_score += 15
            if avg_packet_size > 5000: exfil_score += 15
            if unique_dst_ips < 5 and byte_rate > 100000: exfil_score += 15
            
            if exfil_score > anomaly_score:
                anomaly_score = exfil_score
                attack_type = 'data_exfiltration'
        
        # Ransomware - HIGH RST count, encryption patterns
        if rst_count > 10 or (tcp_packets > 100 and unique_dst_ports > 20):
            ransom_score = 0
            if rst_count > 10: ransom_score += 30
            if rst_count > 50: ransom_score += 25
            if rst_count > 100: ransom_score += 20
            if unique_dst_ports > 20: ransom_score += 15
            if unique_dst_ports > 50: ransom_score += 15
            
            if ransom_score > anomaly_score:
                anomaly_score = ransom_score
                attack_type = 'ransomware'
        
        # Port Scanning - MANY destination ports, SMALL packets
        if unique_dst_ports > 30 and avg_packet_size < 100:
            scan_score = 0
            if unique_dst_ports > 30: scan_score += 30
            if unique_dst_ports > 100: scan_score += 25
            if avg_packet_size < 100: scan_score += 20
            if syn_count > unique_dst_ports * 0.8: scan_score += 15
            
            if scan_score > anomaly_score:
                anomaly_score = scan_score
                attack_type = 'ddos'  # Port scan is a type of reconnaissance
        
        # Anomaly Detection based on traffic history
        if len(self.traffic_history) > 10:
            recent_rates = [h.get('packet_rate', 0) for h in list(self.traffic_history)[-10:]]
            avg_rate = np.mean(recent_rates[:-1]) if len(recent_rates) > 1 else 0
            current_rate = recent_rates[-1] if recent_rates else 0
            
            # Sudden spike detection
            if avg_rate > 0 and current_rate > avg_rate * 3:
                anomaly_score = max(anomaly_score, 70)
                if attack_type == 'normal':
                    attack_type = 'ddos'
        
        # Convert score to confidence
        if anomaly_score >= 70:
            confidence = min(95.0, 70 + anomaly_score * 0.25)
        elif anomaly_score >= 50:
            confidence = 60 + anomaly_score * 0.3
        elif anomaly_score >= 30:
            confidence = 50 + anomaly_score * 0.3
        else:
            attack_type = 'normal'
            confidence = 99.0
        
        return attack_type, confidence
    
    def get_severity(self, t: str, c: float) -> str:
        if t == 'normal': return 'low'
        if c >= 90: return 'critical'
        if c >= 80: return 'high'
        if c >= 70: return 'medium'
        return 'low'

predictor = MLPredictor()
