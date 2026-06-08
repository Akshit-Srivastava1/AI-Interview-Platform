import cv2
import mediapipe as mp
import random

mp_face_mesh = mp.solutions.face_mesh

face_mesh = mp_face_mesh.FaceMesh(
    refine_landmarks=True,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

current_eye_contact = 80
current_confidence = 80
current_engagement = 80
current_speech = 80


# -------------------------
# SMOOTH SCORE TRANSITION
# -------------------------

def smooth_change(current_value, target_value):

    if current_value < target_value:
        current_value += random.randint(2, 5)

    elif current_value > target_value:
        current_value -= random.randint(2, 5)

    return max(0, min(100, current_value))


def analyze_face(frame):

    global current_eye_contact
    global current_confidence
    global current_engagement
    global current_speech

    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    results = face_mesh.process(rgb_frame)

    target_eye_contact = 0
    target_confidence = 0
    target_engagement = 0
    target_speech = 70

    if results.multi_face_landmarks:

        face_landmarks = results.multi_face_landmarks[0]

        left_eye_top = face_landmarks.landmark[159]
        left_eye_bottom = face_landmarks.landmark[145]

        right_eye_top = face_landmarks.landmark[386]
        right_eye_bottom = face_landmarks.landmark[374]

        left_eye_gap = abs(left_eye_top.y - left_eye_bottom.y)

        right_eye_gap = abs(right_eye_top.y - right_eye_bottom.y)

        avg_eye_gap = (left_eye_gap + right_eye_gap) / 2

        print("Eye Gap:", avg_eye_gap)

        nose = face_landmarks.landmark[1]

        face_center_x = nose.x
        nose_y = nose.y

        if avg_eye_gap <= 0.008:
            current_eye_contact = 0
            current_confidence = 0
            current_engagement = 0
            current_speech = 0

            return {
                "eye_contact": 0,
                "confidence": 0,
                "engagement": 0,
                "speech": 0
            }

        elif avg_eye_gap <= 0.015:
            target_eye_contact = 25

        elif avg_eye_gap <= 0.022:
            target_eye_contact = 60

        else:
            target_eye_contact = 100

        if face_center_x < 0.42 or face_center_x > 0.58:
            target_eye_contact -= 30

        target_eye_contact = max(0,  min(100, target_eye_contact))

        left_face = face_landmarks.landmark[234]
        right_face = face_landmarks.landmark[454]

        posture_difference = abs(left_face.y - right_face.y)

        if posture_difference < 0.03:
            posture_score = 100

        elif posture_difference < 0.06:
            posture_score = 70

        else:
            posture_score = 40

        upper_lip = face_landmarks.landmark[13]
        lower_lip = face_landmarks.landmark[14]
        mouth_gap = abs( upper_lip.y - lower_lip.y)

        if mouth_gap > 0.02:
            smile_score = 15
        else:
            smile_score = 0
            
        target_confidence = int((target_eye_contact * 0.5) + (posture_score * 0.4) + smile_score)
        target_confidence = max( 0, min(100, target_confidence))

        if nose_y > 0.55 or nose_y < 0.35:
            head_position_score = 40
        else:
            head_position_score = 100

        face_visibility_score = 100

        if face_center_x < 0.35 or face_center_x > 0.65:
            face_visibility_score = 50

        target_engagement = int((target_eye_contact * 0.5) + (head_position_score * 0.3) + (face_visibility_score * 0.2))
        target_engagement = max(0, min(100, target_engagement))
        target_speech = random.randint(70, 95)
        
    else:
        return {
            "eye_contact": 0,
            "confidence": 0,
            "engagement": 0,
            "speech": 0
        }
    
    current_eye_contact = smooth_change(current_eye_contact, target_eye_contact)
    current_confidence = smooth_change(current_confidence, target_confidence)
    current_engagement = smooth_change(current_engagement, target_engagement)
    current_speech = smooth_change(current_speech, target_speech)

    return {
        "eye_contact": current_eye_contact,
        "confidence": current_confidence,
        "engagement": current_engagement,
        "speech": current_speech
    }