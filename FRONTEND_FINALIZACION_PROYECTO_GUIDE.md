# Guía Frontend: Finalización de Proyecto y Captura de Resultados

## Objetivo

Implementar la interfaz que permita a los Project Managers finalizar proyectos y capturar el resultado real para que el sistema CBR aprenda automáticamente.

---

## Tabla de Contenidos

1. [Flujo de Usuario](#flujo-de-usuario)
2. [Endpoints del Backend](#endpoints-del-backend)
3. [Diseño de la UI](#diseño-de-la-ui)
4. [Implementación React](#implementación-react)
5. [Validaciones y Estados](#validaciones-y-estados)
6. [Ejemplo Completo](#ejemplo-completo)

---

## Flujo de Usuario

### Caso de Uso

**Actor:** Project Manager (PM)  
**Precondición:** Proyecto activo (status: `active`)  
**Flujo Completo:**

```
PASO 1: MARCAR COMO COMPLETADO
================================
1. PM ve lista de proyectos
   └─ Identifica proyecto activo que terminó (status: active)

2. PM hace clic en "Marcar como Completado"
   └─ PATCH /api/projects/:id/complete
   └─ Status cambia de 'active' → 'completed'
   └─ Se establece actualEndDate

PASO 2: CAPTURAR RESULTADO (Para CBR)
=====================================
3. PM ve que el proyecto está completado
   └─ Aparece botón "Capturar Resultado para Aprendizaje"

4. PM hace clic en "Capturar Resultado"
   └─ Se abre formulario modal/página

5. PM completa el formulario:
   ├─ Datos básicos del resultado
   ├─ Riesgos que ocurrieron realmente
   ├─ Lecciones aprendidas
   └─ Prácticas exitosas/fallidas

6. PM envía el formulario
   └─ POST /api/projects/:id/outcome
   └─ Sistema valida y procesa

7. Sistema muestra:
   ├─ Confirmación de éxito
   ├─ Reporte de precisión de predicción
   └─ Impacto en la base de conocimiento

8. Caso guardado en CBR
   └─ Disponible para futuras predicciones
   └─ Campo projectOutcome se llena en el proyecto
```

### Estados del Proyecto

```javascript
Estados posibles:
├─ 'draft'      → Borrador (recién creado)
├─ 'active'     → En ejecución
├─ 'paused'     → Pausado temporalmente
├─ 'completed'  → Terminado ✅ (puede capturar resultado)
└─ 'cancelled'  → Cancelado ❌

Flujo normal:
draft → active → completed → [outcome capturado]
```

---

## Endpoints del Backend

### 0. Marcar Proyecto como Completado (PRIMERO)

**PATCH** `/api/projects/:projectId/complete`

**Descripción:** Marca el proyecto como terminado. Cambia el status de `active` → `completed`.

**Headers:**
```
Authorization: Bearer <token>
```

**Body:** No requiere body

**Respuesta:**
```json
{
  "success": true,
  "message": "Project completed successfully",
  "data": {
    "_id": "674a12...",
    "projectName": "E-commerce Global",
    "status": "completed",
    "actualEndDate": "2024-12-15T10:30:00.000Z",
    "estimatedEndDate": "2024-11-20T00:00:00.000Z"
  }
}
```

**Nota:** Solo después de esto se puede capturar el outcome para el CBR.

---

### 1. Obtener Formulario Pre-rellenado

**GET** `/api/projects/:projectId/outcome/form`

**Headers:**
```
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "projectInfo": {
      "id": "674a12...",
      "name": "E-commerce Global",
      "estimatedStartDate": "2024-06-01",
      "estimatedEndDate": "2024-11-20",
      "actualStartDate": "2024-06-05",
      "status": "completed"
    },
    "predictedRisks": [
      {
        "id": "risk_001",
        "type": "communication_breakdown",
        "severity": "high",
        "probability": 0.75,
        "description": "Time zone conflicts may cause communication delays"
      },
      {
        "id": "risk_002",
        "type": "skill_gap",
        "severity": "medium",
        "probability": 0.55,
        "description": "Team may lack experience in AWS serverless"
      }
    ],
    "requiredFields": [
      "completed",
      "qualityScore",
      "clientSatisfaction",
      "teamMorale"
    ],
    "optionalFields": [
      "actualCompletedDate",
      "budgetOverrun",
      "actualizedRisks",
      "lessonsLearned",
      "successfulPractices",
      "unsuccessfulPractices",
      "metrics"
    ]
  }
}
```

### 2. Capturar Resultado del Proyecto

**POST** `/api/projects/:projectId/outcome`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "completed": true,
  "actualCompletedDate": "2024-12-15T00:00:00Z",
  "budgetOverrun": 15,
  "qualityScore": 4,
  "clientSatisfaction": 5,
  "teamMorale": 4,
  
  "actualizedRisks": [
    {
      "type": "communication_breakdown",
      "occurred": true,
      "severity": "high",
      "description": "Equipo en Asia no podía asistir a reuniones diarias",
      "detectedAt": "2024-08-01T00:00:00Z",
      "mitigatedAt": "2024-09-15T00:00:00Z",
      "scheduleDelayDays": 20,
      "budgetOverrunPercent": 10,
      "qualityImpact": "medium",
      "rootCause": "Time zone overlap too small (only 3 hours)",
      "avoidanceReason": null
    },
    {
      "type": "skill_gap",
      "occurred": true,
      "severity": "medium",
      "description": "Equipo no dominaba AWS Lambda y Step Functions",
      "detectedAt": "2024-07-10T00:00:00Z",
      "mitigatedAt": "2024-08-20T00:00:00Z",
      "scheduleDelayDays": 5,
      "budgetOverrunPercent": 3,
      "qualityImpact": "low",
      "rootCause": "Lack of serverless experience in team"
    },
    {
      "type": "team_overload",
      "occurred": false,
      "avoidanceReason": "Good resource planning and realistic sprint goals"
    }
  ],
  
  "lessonsLearned": [
    "Equipos distribuidos en más de 2 zonas requieren al menos 4 horas de overlap",
    "AWS Lambda requiere capacitación previa de al menos 2 semanas",
    "Reuniones diarias no funcionan bien con 3 regiones diferentes",
    "La documentación asíncrona en Notion redujo dependencia de reuniones"
  ],
  
  "successfulPractices": [
    {
      "practice": "Daily async updates in Slack with structured template",
      "impact": "Reduced meeting dependency by 40% and improved transparency",
      "replicable": true
    },
    {
      "practice": "2-week AWS training bootcamp before project start",
      "impact": "Team was productive with serverless from week 3",
      "replicable": true
    },
    {
      "practice": "Code reviews with async feedback (24h max response)",
      "impact": "Quality maintained without blocking developers",
      "replicable": true
    }
  ],
  
  "unsuccessfulPractices": [
    {
      "practice": "Daily standup at 9 AM CET",
      "impact": "Asian team had to wake up at 4 AM, causing fatigue",
      "reason": "Did not consider time zone differences properly"
    },
    {
      "practice": "Real-time pair programming across regions",
      "impact": "Very inefficient due to lag and scheduling conflicts",
      "reason": "Time zones and internet latency made it impractical"
    }
  ],
  
  "recommendations": [
    "For future distributed projects: Use async-first communication",
    "Schedule critical meetings during overlap hours only",
    "Invest in training before starting with new cloud technologies"
  ],
  
  "metrics": {
    "avgVelocity": 28,
    "bugRate": 0.08,
    "meetingEfficiency": 3,
    "teamMoraleProgression": [4, 3, 3, 4, 4],
    "deploymentFrequency": "weekly",
    "codeReviewTimeAvg": 1.5,
    "cicdStability": 4
  }
}
```

**Respuesta Exitosa:**
```json
{
  "success": true,
  "message": "Project outcome captured successfully. System has learned from this project.",
  "data": {
    "project": {
      "id": "674a12...",
      "name": "E-commerce Global",
      "outcome": {
        "completed": true,
        "onTime": false,
        "delayDays": 25,
        "budgetOverrun": 15,
        "qualityScore": 4
      }
    },
    "case": {
      "id": "674b34...",
      "caseId": "674a12...",
      "addedToKnowledgeBase": true
    },
    "predictionAccuracy": {
      "overall": 0.85,
      "correctPredictions": 2,
      "falsePositives": 0,
      "falseNegatives": 1,
      "message": "85% of predicted risks were accurate"
    },
    "learningReport": {
      "accuracy": {
        "communication_breakdown": {
          "predicted": true,
          "occurred": true,
          "result": "correct_prediction"
        },
        "skill_gap": {
          "predicted": true,
          "occurred": true,
          "result": "correct_prediction"
        },
        "team_overload": {
          "predicted": true,
          "occurred": false,
          "result": "false_positive"
        }
      },
      "learnings": {
        "strengthenedBeliefs": [
          "Communication breakdown is highly likely in multi-region teams with <4h overlap",
          "Skill gaps in cloud technologies require formal training"
        ],
        "newInsights": [
          "AWS Lambda requires 2 weeks training for mid-level developers",
          "Async documentation tools reduce meeting dependency"
        ],
        "surprises": [
          "Team overload did not materialize despite predictions"
        ]
      },
      "caseComparison": {
        "newCase": {
          "delayDays": 25,
          "budgetOverrun": 15,
          "qualityScore": 4
        },
        "similarPastCases": []
      },
      "systemImpact": {
        "caseBaseSize": 8,
        "expectedConfidenceIncrease": 0.12,
        "message": "This case significantly improves prediction confidence for similar projects"
      }
    }
  }
}
```

**Errores Posibles:**
```json
// 404 - Proyecto no encontrado
{
  "success": false,
  "error": "Project not found"
}

// 403 - Sin permisos
{
  "success": false,
  "error": "Not authorized to update project outcome"
}

// 400 - Datos inválidos
{
  "success": false,
  "error": "qualityScore must be between 1 and 5"
}
```

---

## Diseño de la UI

### Estructura Recomendada

```
┌─────────────────────────────────────────────────────────────┐
│  Finalizar Proyecto: E-commerce Global                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  📊 SECCIÓN 1: Resultado General                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ✓ ¿El proyecto se completó exitosamente?             │  │
│  │   ○ Sí  ● No  ○ Parcialmente                         │  │
│  │                                                        │  │
│  │ 📅 Fecha de finalización real:                        │  │
│  │   [15/12/2024]                                        │  │
│  │                                                        │  │
│  │ 💰 Presupuesto sobrepasado (%):                       │  │
│  │   [15] %                                              │  │
│  │                                                        │  │
│  │ ⭐ Puntuaciones (1-5):                                │  │
│  │   Calidad:      ⭐⭐⭐⭐☆                              │  │
│  │   Cliente:      ⭐⭐⭐⭐⭐                              │  │
│  │   Equipo:       ⭐⭐⭐⭐☆                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ⚠️  SECCIÓN 2: Riesgos Predichos vs Reales                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Se predijeron 3 riesgos. ¿Cuáles ocurrieron?         │  │
│  │                                                        │  │
│  │ ☑ Communication Breakdown (High)                     │  │
│  │   ├─ ✓ Ocurrió                                       │  │
│  │   ├─ Descripción: [Equipo Asia no podía asistir...] │  │
│  │   ├─ Detectado: [01/08/2024]                         │  │
│  │   ├─ Retraso causado: [20 días]                      │  │
│  │   ├─ Presupuesto extra: [10%]                        │  │
│  │   └─ Causa raíz: [Time zone overlap too small]      │  │
│  │                                                        │  │
│  │ ☑ Skill Gap (Medium)                                 │  │
│  │   ├─ ✓ Ocurrió                                       │  │
│  │   └─ ... (expandible)                                │  │
│  │                                                        │  │
│  │ ☐ Team Overload (High)                               │  │
│  │   ├─ ✗ No ocurrió                                    │  │
│  │   └─ Razón: [Good resource planning]                │  │
│  │                                                        │  │
│  │ [+ Añadir riesgo no predicho]                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  💡 SECCIÓN 3: Lecciones Aprendidas                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 1. [Equipos distribuidos requieren >4h overlap]      │  │
│  │ 2. [AWS Lambda requiere 2 semanas training]          │  │
│  │ [+ Añadir lección]                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ✅ SECCIÓN 4: Prácticas Exitosas                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 🎯 Async updates in Slack                            │  │
│  │    Impacto: Reduced meetings 40%                     │  │
│  │    ¿Replicable? ✓ Sí                                 │  │
│  │                                                        │  │
│  │ [+ Añadir práctica exitosa]                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ❌ SECCIÓN 5: Prácticas Fallidas                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 💔 Daily standup at 9 AM CET                         │  │
│  │    Impacto: Asian team fatigue                       │  │
│  │    Razón: No consideró zonas horarias                │  │
│  │                                                        │  │
│  │ [+ Añadir práctica fallida]                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  📈 SECCIÓN 6: Métricas (Opcional)                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Velocidad promedio: [28 puntos/sprint]               │  │
│  │ Bug rate: [0.08 bugs/feature]                        │  │
│  │ Frecuencia de deploy: [Semanal ▼]                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  [Cancelar]  [Guardar y Aprender] ← CTA principal          │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de Interacción

```
1. Usuario carga el formulario
   └─ GET /api/projects/:id/outcome/form
   └─ Se pre-rellena con riesgos predichos

2. Usuario completa formulario
   ├─ Validaciones en tiempo real
   └─ Ayuda contextual disponible

3. Usuario hace clic en "Guardar y Aprender"
   ├─ POST /api/projects/:id/outcome
   └─ Loading state con mensaje: "Analizando resultados..."

4. Sistema responde
   └─ Modal de éxito con reporte

5. Modal de Reporte
   ┌─────────────────────────────────────────┐
   │  ✅ Proyecto Finalizado                  │
   │                                          │
   │  📊 Precisión de Predicción: 85%        │
   │  ✓ 2 riesgos predichos correctamente    │
   │  ⚠ 1 falso positivo                     │
   │                                          │
   │  🧠 Sistema Mejorado                     │
   │  • Caso añadido a base de conocimiento  │
   │  • Confianza aumentó +12%                │
   │  • Total casos: 8                        │
   │                                          │
   │  💡 Lecciones Capturadas: 4             │
   │  ✅ Prácticas Exitosas: 3               │
   │  ❌ Prácticas Fallidas: 2               │
   │                                          │
   │  [Ver Reporte Completo] [Cerrar]        │
   └─────────────────────────────────────────┘
```

---

## Implementación React

### 1. Componente Principal

```jsx
// components/ProjectCompletion/ProjectCompletionForm.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  Form,
  Spin,
  message,
  Modal,
  Steps,
  Divider,
  Alert
} from 'antd';
import {
  CheckCircleOutlined,
  WarningOutlined,
  BulbOutlined,
  RocketOutlined
} from '@ant-design/icons';
import GeneralOutcomeSection from './sections/GeneralOutcomeSection';
import RisksSection from './sections/RisksSection';
import LessonsLearnedSection from './sections/LessonsLearnedSection';
import PracticesSection from './sections/PracticesSection';
import MetricsSection from './sections/MetricsSection';
import ResultsModal from './ResultsModal';
import { getOutcomeForm, submitOutcome } from '../../services/projectService';

const { Step } = Steps;

const ProjectCompletionForm = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [projectData, setProjectData] = useState(null);
  const [predictedRisks, setPredictedRisks] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    loadFormData();
  }, [projectId]);

  const loadFormData = async () => {
    try {
      setLoading(true);
      const response = await getOutcomeForm(projectId);
      
      setProjectData(response.data.projectInfo);
      setPredictedRisks(response.data.predictedRisks);
      
      // Pre-rellenar campos
      form.setFieldsValue({
        completed: true,
        actualCompletedDate: new Date().toISOString(),
        qualityScore: 3,
        clientSatisfaction: 3,
        teamMorale: 3,
        budgetOverrun: 0
      });
    } catch (error) {
      // Check if error is about project not being completed
      if (error.response?.data?.error?.includes('must be marked as completed')) {
        message.error({
          content: 'Este proyecto debe estar marcado como "Completado" antes de capturar el resultado. Por favor, completa el proyecto primero.',
          duration: 5
        });
        // Redirect back to projects list
        setTimeout(() => navigate('/projects'), 2000);
      } else {
        message.error('Error cargando datos del proyecto');
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);
      
      const outcomeData = {
        completed: values.completed,
        actualCompletedDate: values.actualCompletedDate,
        budgetOverrun: values.budgetOverrun || 0,
        qualityScore: values.qualityScore,
        clientSatisfaction: values.clientSatisfaction,
        teamMorale: values.teamMorale,
        actualizedRisks: values.actualizedRisks || [],
        lessonsLearned: values.lessonsLearned || [],
        successfulPractices: values.successfulPractices || [],
        unsuccessfulPractices: values.unsuccessfulPractices || [],
        recommendations: values.recommendations || [],
        metrics: values.metrics || {}
      };

      const response = await submitOutcome(projectId, outcomeData);
      
      setResults(response.data);
      setShowResults(true);
      message.success('Resultado capturado exitosamente. Sistema ha aprendido de este proyecto.');
      
    } catch (error) {
      message.error(error.response?.data?.error || 'Error al capturar resultado');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    {
      title: 'Resultado General',
      icon: <CheckCircleOutlined />,
      content: <GeneralOutcomeSection form={form} projectData={projectData} />
    },
    {
      title: 'Riesgos',
      icon: <WarningOutlined />,
      content: (
        <RisksSection
          form={form}
          predictedRisks={predictedRisks}
        />
      )
    },
    {
      title: 'Aprendizajes',
      icon: <BulbOutlined />,
      content: (
        <>
          <LessonsLearnedSection form={form} />
          <Divider />
          <PracticesSection form={form} />
        </>
      )
    },
    {
      title: 'Métricas',
      icon: <RocketOutlined />,
      content: <MetricsSection form={form} />
    }
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>Cargando datos del proyecto...</p>
      </div>
    );
  }

  return (
    <div className="project-completion-form">
      <Card
        title={
          <div>
            <h2>Finalizar Proyecto: {projectData?.name}</h2>
            <p style={{ color: '#888', fontWeight: 'normal' }}>
              Captura el resultado real para que el sistema aprenda y mejore futuras predicciones
            </p>
          </div>
        }
      >
        <Alert
          message="¿Por qué es importante?"
          description="Al capturar el resultado real de este proyecto, el sistema CBR aprenderá de esta experiencia y mejorará las predicciones de riesgos para futuros proyectos similares en tu organización."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Steps current={currentStep} style={{ marginBottom: 32 }}>
          {steps.map((item) => (
            <Step key={item.title} title={item.title} icon={item.icon} />
          ))}
        </Steps>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <div className="steps-content">
            {steps[currentStep].content}
          </div>

          <div className="steps-action" style={{ marginTop: 24 }}>
            {currentStep > 0 && (
              <Button
                style={{ marginRight: 8 }}
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                Anterior
              </Button>
            )}
            {currentStep < steps.length - 1 && (
              <Button
                type="primary"
                onClick={() => setCurrentStep(currentStep + 1)}
              >
                Siguiente
              </Button>
            )}
            {currentStep === steps.length - 1 && (
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                icon={<CheckCircleOutlined />}
              >
                Guardar y Aprender
              </Button>
            )}
            <Button
              style={{ marginLeft: 8 }}
              onClick={() => navigate('/projects')}
            >
              Cancelar
            </Button>
          </div>
        </Form>
      </Card>

      <ResultsModal
        visible={showResults}
        results={results}
        onClose={() => {
          setShowResults(false);
          navigate('/projects');
        }}
      />
    </div>
  );
};

export default ProjectCompletionForm;
```

### 2. Sección de Riesgos

```jsx
// components/ProjectCompletion/sections/RisksSection.jsx
import React from 'react';
import {
  Form,
  Checkbox,
  Input,
  DatePicker,
  InputNumber,
  Select,
  Card,
  Space,
  Button,
  Collapse,
  Tag
} from 'antd';
import {
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined
} from '@ant-design/icons';

const { TextArea } = Input;
const { Panel } = Collapse;
const { Option } = Select;

const RisksSection = ({ form, predictedRisks }) => {
  const [risks, setRisks] = React.useState(
    predictedRisks.map(risk => ({
      ...risk,
      occurred: false,
      expanded: false
    }))
  );

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'red',
      high: 'orange',
      medium: 'gold',
      low: 'green'
    };
    return colors[severity] || 'default';
  };

  const handleRiskOccurred = (index, occurred) => {
    const newRisks = [...risks];
    newRisks[index].occurred = occurred;
    newRisks[index].expanded = occurred;
    setRisks(newRisks);
  };

  const addUnpredictedRisk = () => {
    setRisks([
      ...risks,
      {
        id: `unpredicted_${Date.now()}`,
        type: 'other',
        severity: 'medium',
        description: '',
        occurred: true,
        expanded: true,
        unpredicted: true
      }
    ]);
  };

  return (
    <div>
      <h3>
        <WarningOutlined /> Riesgos Predichos vs Reales
      </h3>
      <p style={{ color: '#666', marginBottom: 16 }}>
        Se predijeron {predictedRisks.length} riesgos para este proyecto.
        Indica cuáles ocurrieron realmente y proporciona detalles.
      </p>

      <Form.List name="actualizedRisks" initialValue={risks}>
        {(fields, { add, remove }) => (
          <>
            {risks.map((risk, index) => (
              <Card
                key={risk.id}
                size="small"
                style={{ marginBottom: 16 }}
                title={
                  <Space>
                    {risk.unpredicted ? (
                      <Tag color="purple">No Predicho</Tag>
                    ) : null}
                    <Tag color={getSeverityColor(risk.severity)}>
                      {risk.severity.toUpperCase()}
                    </Tag>
                    <span>{getRiskTypeLabel(risk.type)}</span>
                  </Space>
                }
                extra={
                  <Checkbox
                    checked={risk.occurred}
                    onChange={(e) => handleRiskOccurred(index, e.target.checked)}
                  >
                    {risk.occurred ? (
                      <Space>
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        Ocurrió
                      </Space>
                    ) : (
                      <Space>
                        <CloseCircleOutlined style={{ color: '#999' }} />
                        No Ocurrió
                      </Space>
                    )}
                  </Checkbox>
                }
              >
                {!risk.unpredicted && (
                  <p style={{ color: '#666', fontSize: 12, marginBottom: 12 }}>
                    Predicción: {risk.description}
                  </p>
                )}

                {risk.occurred ? (
                  <Collapse activeKey={risk.expanded ? ['details'] : []}>
                    <Panel header="Detalles del Riesgo" key="details">
                      <Form.Item
                        name={[index, 'type']}
                        label="Tipo"
                        initialValue={risk.type}
                        hidden={!risk.unpredicted}
                      >
                        <Select>
                          <Option value="communication_breakdown">
                            Communication Breakdown
                          </Option>
                          <Option value="skill_gap">Skill Gap</Option>
                          <Option value="team_overload">Team Overload</Option>
                          <Option value="dependency_blockage">
                            Dependency Blockage
                          </Option>
                          <Option value="scope_creep">Scope Creep</Option>
                          <Option value="process_mismatch">
                            Process Mismatch
                          </Option>
                          <Option value="technical_infrastructure">
                            Technical Infrastructure
                          </Option>
                          <Option value="quality_degradation">
                            Quality Degradation
                          </Option>
                          <Option value="other">Otro</Option>
                        </Select>
                      </Form.Item>

                      <Form.Item
                        name={[index, 'description']}
                        label="Descripción de lo que ocurrió"
                        rules={[{ required: true, message: 'Requerido' }]}
                      >
                        <TextArea
                          rows={3}
                          placeholder="Ej: Equipo en Asia no podía asistir a reuniones diarias debido a diferencia horaria"
                        />
                      </Form.Item>

                      <Form.Item
                        name={[index, 'detectedAt']}
                        label="Fecha de detección"
                      >
                        <DatePicker style={{ width: '100%' }} />
                      </Form.Item>

                      <Form.Item
                        name={[index, 'mitigatedAt']}
                        label="Fecha de mitigación"
                      >
                        <DatePicker style={{ width: '100%' }} />
                      </Form.Item>

                      <Space style={{ width: '100%' }} direction="vertical">
                        <Form.Item
                          name={[index, 'scheduleDelayDays']}
                          label="Días de retraso causados"
                        >
                          <InputNumber
                            min={0}
                            style={{ width: '100%' }}
                            placeholder="0"
                          />
                        </Form.Item>

                        <Form.Item
                          name={[index, 'budgetOverrunPercent']}
                          label="% presupuesto extra"
                        >
                          <InputNumber
                            min={0}
                            max={100}
                            style={{ width: '100%' }}
                            placeholder="0"
                          />
                        </Form.Item>

                        <Form.Item
                          name={[index, 'qualityImpact']}
                          label="Impacto en calidad"
                        >
                          <Select placeholder="Seleccionar">
                            <Option value="none">Sin impacto</Option>
                            <Option value="low">Bajo</Option>
                            <Option value="medium">Medio</Option>
                            <Option value="high">Alto</Option>
                          </Select>
                        </Form.Item>
                      </Space>

                      <Form.Item
                        name={[index, 'rootCause']}
                        label="Causa raíz"
                        rules={[{ required: true, message: 'Requerido' }]}
                      >
                        <TextArea
                          rows={2}
                          placeholder="Ej: Time zone overlap too small (only 3 hours)"
                        />
                      </Form.Item>

                      <Form.Item
                        name={[index, 'occurred']}
                        initialValue={true}
                        hidden
                      >
                        <Input />
                      </Form.Item>
                    </Panel>
                  </Collapse>
                ) : (
                  <Form.Item
                    name={[index, 'avoidanceReason']}
                    label="¿Por qué no ocurrió?"
                  >
                    <TextArea
                      rows={2}
                      placeholder="Ej: Good resource planning and realistic sprint goals"
                    />
                  </Form.Item>
                )}
              </Card>
            ))}

            <Button
              type="dashed"
              onClick={addUnpredictedRisk}
              block
              icon={<PlusOutlined />}
            >
              Añadir Riesgo No Predicho
            </Button>
          </>
        )}
      </Form.List>
    </div>
  );
};

const getRiskTypeLabel = (type) => {
  const labels = {
    communication_breakdown: 'Communication Breakdown',
    skill_gap: 'Skill Gap',
    team_overload: 'Team Overload',
    dependency_blockage: 'Dependency Blockage',
    scope_creep: 'Scope Creep',
    process_mismatch: 'Process Mismatch',
    technical_infrastructure: 'Technical Infrastructure',
    quality_degradation: 'Quality Degradation',
    other: 'Otro'
  };
  return labels[type] || type;
};

export default RisksSection;
```

### 3. Modal de Resultados

```jsx
// components/ProjectCompletion/ResultsModal.jsx
import React from 'react';
import {
  Modal,
  Result,
  Card,
  Statistic,
  Row,
  Col,
  List,
  Tag,
  Progress,
  Divider,
  Button
} from 'antd';
import {
  CheckCircleOutlined,
  TrophyOutlined,
  BulbOutlined,
  RocketOutlined,
  LineChartOutlined
} from '@ant-design/icons';

const ResultsModal = ({ visible, results, onClose }) => {
  if (!results) return null;

  const { predictionAccuracy, learningReport, case: caseInfo } = results;

  const accuracyPercent = Math.round(predictionAccuracy.overall * 100);

  return (
    <Modal
      visible={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="report" type="link">
          Ver Reporte Completo
        </Button>,
        <Button key="close" type="primary" onClick={onClose}>
          Cerrar
        </Button>
      ]}
      title={null}
    >
      <Result
        status="success"
        icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
        title="¡Proyecto Finalizado Exitosamente!"
        subTitle="El sistema ha aprendido de esta experiencia y está listo para mejorar futuras predicciones"
      />

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Precisión de Predicción"
              value={accuracyPercent}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: accuracyPercent >= 70 ? '#3f8600' : '#cf1322' }}
            />
            <Progress
              percent={accuracyPercent}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068'
              }}
              showInfo={false}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card>
            <Statistic
              title="Predicciones Correctas"
              value={predictionAccuracy.correctPredictions}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card>
            <Statistic
              title="Total Casos en Base"
              value={learningReport.systemImpact.caseBaseSize}
              prefix={<BulbOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <span>
            <LineChartOutlined /> Impacto en el Sistema
          </span>
        }
        size="small"
        style={{ marginBottom: 16 }}
      >
        <List size="small">
          <List.Item>
            <span>Caso añadido a base de conocimiento:</span>
            <Tag color="green">Completado</Tag>
          </List.Item>
          <List.Item>
            <span>Aumento esperado de confianza:</span>
            <strong>
              +{Math.round(learningReport.systemImpact.expectedConfidenceIncrease * 100)}%
            </strong>
          </List.Item>
          <List.Item>
            <span>Casos reales en organización:</span>
            <strong>{learningReport.systemImpact.caseBaseSize}</strong>
          </List.Item>
        </List>
      </Card>

      {learningReport.learnings && (
        <>
          <Divider>Aprendizajes Clave</Divider>

          {learningReport.learnings.strengthenedBeliefs?.length > 0 && (
            <Card
              title="✅ Creencias Reforzadas"
              size="small"
              style={{ marginBottom: 12 }}
            >
              <List
                size="small"
                dataSource={learningReport.learnings.strengthenedBeliefs}
                renderItem={(item) => <List.Item>{item}</List.Item>}
              />
            </Card>
          )}

          {learningReport.learnings.newInsights?.length > 0 && (
            <Card
              title="💡 Nuevos Insights"
              size="small"
              style={{ marginBottom: 12 }}
            >
              <List
                size="small"
                dataSource={learningReport.learnings.newInsights}
                renderItem={(item) => <List.Item>{item}</List.Item>}
              />
            </Card>
          )}

          {learningReport.learnings.surprises?.length > 0 && (
            <Card title="🎯 Sorpresas" size="small">
              <List
                size="small"
                dataSource={learningReport.learnings.surprises}
                renderItem={(item) => <List.Item>{item}</List.Item>}
              />
            </Card>
          )}
        </>
      )}
    </Modal>
  );
};

export default ResultsModal;
```

### 4. Servicio API

```javascript
// services/projectService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

/**
 * Obtiene el formulario pre-rellenado para capturar el resultado
 */
export const getOutcomeForm = async (projectId) => {
  try {
    const response = await axios.get(
      `${API_URL}/projects/${projectId}/outcome/form`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Envía el resultado del proyecto para que el CBR aprenda
 */
export const submitOutcome = async (projectId, outcomeData) => {
  try {
    const response = await axios.post(
      `${API_URL}/projects/${projectId}/outcome`,
      outcomeData,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Obtiene estadísticas de la base de casos
 */
export const getCaseBaseStats = async (organizationId) => {
  try {
    const response = await axios.get(
      `${API_URL}/organizations/${organizationId}/case-base/stats`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};
```

---

## Validaciones y Estados

### Validaciones del Formulario

```javascript
const validationRules = {
  completed: [
    { required: true, message: 'Indica si el proyecto se completó' }
  ],
  
  qualityScore: [
    { required: true, message: 'Calificación de calidad requerida' },
    {
      type: 'number',
      min: 1,
      max: 5,
      message: 'Debe ser entre 1 y 5'
    }
  ],
  
  clientSatisfaction: [
    { required: true, message: 'Satisfacción del cliente requerida' },
    {
      type: 'number',
      min: 1,
      max: 5,
      message: 'Debe ser entre 1 y 5'
    }
  ],
  
  teamMorale: [
    { required: true, message: 'Moral del equipo requerida' },
    {
      type: 'number',
      min: 1,
      max: 5,
      message: 'Debe ser entre 1 y 5'
    }
  ],
  
  budgetOverrun: [
    {
      type: 'number',
      min: 0,
      message: 'No puede ser negativo'
    }
  ],
  
  actualizedRisks: [
    {
      validator: (_, value) => {
        if (!value || value.length === 0) {
          return Promise.reject(
            'Debes indicar al menos qué riesgos ocurrieron o no'
          );
        }
        
        const occurredRisks = value.filter(r => r.occurred);
        for (const risk of occurredRisks) {
          if (!risk.description) {
            return Promise.reject(
              'Los riesgos que ocurrieron requieren descripción'
            );
          }
          if (!risk.rootCause) {
            return Promise.reject(
              'Los riesgos que ocurrieron requieren causa raíz'
            );
          }
        }
        
        return Promise.resolve();
      }
    }
  ]
};
```

### Estados de Carga

```jsx
const LoadingStates = {
  IDLE: 'idle',
  LOADING_FORM: 'loading_form',
  SUBMITTING: 'submitting',
  SUCCESS: 'success',
  ERROR: 'error'
};

// Uso
const [loadingState, setLoadingState] = useState(LoadingStates.IDLE);

// Durante carga
{loadingState === LoadingStates.LOADING_FORM && (
  <Spin tip="Cargando datos del proyecto..." />
)}

// Durante submit
{loadingState === LoadingStates.SUBMITTING && (
  <Spin tip="Analizando resultados y aprendiendo..." />
)}
```

---

## Ejemplo Completo

### Flujo de Usuario Completo

```jsx
// App.jsx - Rutas
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProjectCompletionForm from './components/ProjectCompletion/ProjectCompletionForm';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ... otras rutas ... */}
        <Route
          path="/projects/:projectId/capture-outcome"
          element={<ProjectCompletionForm />}
        />
      </Routes>
    </BrowserRouter>
  );
}

// ProjectsList.jsx - Botones según estado
const ProjectsList = () => {
  const navigate = useNavigate();

  const handleCompleteProject = async (projectId) => {
    try {
      const response = await axios.patch(
        `${API_URL}/projects/${projectId}/complete`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      message.success('Proyecto marcado como completado');
      
      // Preguntar si quiere capturar resultado ahora
      Modal.confirm({
        title: '¿Capturar resultado ahora?',
        content: 'El proyecto está completado. ¿Deseas capturar el resultado para que el sistema aprenda?',
        okText: 'Sí, capturar ahora',
        cancelText: 'Después',
        onOk: () => {
          navigate(`/projects/${projectId}/capture-outcome`);
        },
        onCancel: () => {
          // Recargar lista
          loadProjects();
        }
      });
    } catch (error) {
      message.error('Error al completar proyecto');
    }
  };

  return (
    <Table
      dataSource={projects}
      columns={[
        {
          title: 'Nombre',
          dataIndex: 'projectName',
          key: 'projectName'
        },
        {
          title: 'Estado',
          dataIndex: 'status',
          key: 'status',
          render: (status) => {
            const statusConfig = {
              draft: { color: 'default', text: 'BORRADOR' },
              active: { color: 'blue', text: 'ACTIVO' },
              paused: { color: 'orange', text: 'PAUSADO' },
              completed: { color: 'green', text: 'COMPLETADO' },
              cancelled: { color: 'red', text: 'CANCELADO' }
            };
            const config = statusConfig[status] || statusConfig.draft;
            
            return (
              <Tag color={config.color}>{config.text}</Tag>
            );
          }
        },
        {
          title: 'Acciones',
          key: 'actions',
          render: (_, record) => {
            // Proyecto activo → puede marcar como completado
            if (record.status === 'active') {
              return (
                <Button
                  type="default"
                  icon={<CheckOutlined />}
                  onClick={() => handleCompleteProject(record._id)}
                >
                  Marcar Completado
                </Button>
              );
            }
            
            // Proyecto completado sin outcome → puede capturar
            if (record.status === 'completed' && !record.projectOutcome) {
              return (
                <Space>
                  <Tag color="green">COMPLETADO</Tag>
                  <Button
                    type="primary"
                    icon={<BulbOutlined />}
                    onClick={() => navigate(`/projects/${record._id}/capture-outcome`)}
                  >
                    Capturar Resultado
                  </Button>
                </Space>
              );
            }
            
            // Proyecto completado con outcome → ya capturado
            if (record.status === 'completed' && record.projectOutcome) {
              return (
                <Space>
                  <Tag color="green" icon={<CheckCircleOutlined />}>
                    RESULTADO CAPTURADO
                  </Tag>
                  <Button
                    size="small"
                    type="link"
                    onClick={() => navigate(`/projects/${record._id}/report`)}
                  >
                    Ver Reporte
                  </Button>
                </Space>
              );
            }
            
            // Otros estados
            return <span>-</span>;
          }
        }
      ]}
    />
  );
};
```

---

## Notas Importantes

### Permisos

Solo el **Project Manager** o **Admin de la organización** pueden:
- Marcar el proyecto como completado
- Capturar el resultado del proyecto

### Flujo de Estados

```
1. Proyecto en ejecución (status: 'active')
   ↓
2. PM marca como completado
   └─ PATCH /api/projects/:id/complete
   └─ Status → 'completed'
   └─ actualEndDate se establece
   ↓
3. PM captura resultado (puede ser inmediatamente o días después)
   └─ POST /api/projects/:id/outcome
   └─ Se crea caso CBR
   └─ Campo projectOutcome se llena
```

### Momento Óptimo

**Para marcar como completado:**
- Cuando el proyecto realmente termina (entrega final, despliegue a producción, etc.)

**Para capturar resultado:**
- **Ideal:** Inmediatamente después de marcar como completado
- **Aceptable:** Dentro de 1 semana (mientras la memoria es fresca)
- **Límite:** Máximo 1 mes (después la información puede no ser precisa)

**Nota:** Los dos pasos están separados para dar flexibilidad:
- El PM puede marcar como completado inmediatamente
- Puede tomarse tiempo para recopilar información detallada para el outcome
- Pero el proyecto queda marcado como terminado desde el primer paso

### Datos Obligatorios vs Opcionales

**Obligatorios:**
- ✅ `completed` (boolean)
- ✅ `qualityScore` (1-5)
- ✅ `clientSatisfaction` (1-5)
- ✅ `teamMorale` (1-5)
- ✅ `actualizedRisks` (al menos indicar qué ocurrió)

**Opcionales pero Recomendados:**
- 💡 `lessonsLearned` (muy valioso)
- ✅ `successfulPractices` (ayuda a replicar éxitos)
- ❌ `unsuccessfulPractices` (previene errores futuros)

**Opcionales:**
- `budgetOverrun`
- `metrics`
- `recommendations`

### Mejores Prácticas

1. **Captura inmediata**: No esperes mucho tiempo después de finalizar
2. **Sé específico**: Descripciones detalladas ayudan más al sistema
3. **Causa raíz**: Identificar la causa raíz es crucial para el aprendizaje
4. **Lecciones honestas**: Captura tanto éxitos como fracasos
5. **Cuantifica**: Proporciona números (días de retraso, % presupuesto) cuando sea posible

---

## Recursos Adicionales

### Documentación Backend

- [CBR_APRENDIZAJE_EXPLICACION.md](CBR_APRENDIZAJE_EXPLICACION.md) - Cómo funciona el CBR
- [API_PREDICCION_RIESGOS_FRONTEND.md](API_PREDICCION_RIESGOS_FRONTEND.md) - API completa

### Endpoints Relacionados

```
# Gestión de Estado del Proyecto
PATCH /api/projects/:id/activate           # draft → active
PATCH /api/projects/:id/complete           # active → completed ⭐
PATCH /api/projects/:id/cancel             # any → cancelled

# Captura de Resultado (CBR)
GET  /api/projects/:id/outcome/form         # Obtener formulario
POST /api/projects/:id/outcome              # Capturar resultado ⭐

# Estadísticas y Reportes
GET  /api/organizations/:id/case-base/stats # Estadísticas CBR
GET  /api/organizations/:id/risks/accuracy  # Precisión de predicciones
```

### Tipos TypeScript (si usas TS)

```typescript
interface OutcomeData {
  completed: boolean;
  actualCompletedDate?: string;
  budgetOverrun?: number;
  qualityScore: number;
  clientSatisfaction: number;
  teamMorale: number;
  actualizedRisks: ActualizedRisk[];
  lessonsLearned?: string[];
  successfulPractices?: Practice[];
  unsuccessfulPractices?: Practice[];
  recommendations?: string[];
  metrics?: ProjectMetrics;
}

interface ActualizedRisk {
  type: string;
  occurred: boolean;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  detectedAt?: string;
  mitigatedAt?: string;
  scheduleDelayDays?: number;
  budgetOverrunPercent?: number;
  qualityImpact?: 'none' | 'low' | 'medium' | 'high';
  rootCause?: string;
  avoidanceReason?: string;
}

interface Practice {
  practice: string;
  impact: string;
  replicable?: boolean;
  reason?: string;
}

interface ProjectMetrics {
  avgVelocity?: number;
  bugRate?: number;
  meetingEfficiency?: number;
  teamMoraleProgression?: number[];
  deploymentFrequency?: string;
  codeReviewTimeAvg?: number;
  cicdStability?: number;
}
```

---

¡Con esta guía, tu frontend estará listo para capturar resultados de proyectos y permitir que el sistema CBR aprenda automáticamente! 🚀
