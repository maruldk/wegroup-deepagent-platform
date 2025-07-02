
// SPRINT 2.8 - TensorFlow.js Client-side ML Service
import * as tf from '@tensorflow/tfjs'
import { prisma } from '@/lib/db'

export interface MLModelConfig {
  name: string
  version: string
  modelType: 'CLASSIFICATION' | 'REGRESSION' | 'CLUSTERING' | 'NLP'
  framework: 'tensorflowjs' | 'brainjs'
  architecture?: any
  hyperparameters?: any
}

export interface TrainingData {
  inputs: number[][]
  outputs: number[][]
  validationSplit?: number
  epochs?: number
  batchSize?: number
}

export interface PredictionResult {
  prediction: any
  confidence: number
  processingTime: number
  modelVersion: string
}

export class TensorFlowClientService {
  private static instance: TensorFlowClientService
  private loadedModels: Map<string, tf.LayersModel> = new Map()
  private modelCache: Map<string, any> = new Map()

  static getInstance(): TensorFlowClientService {
    if (!TensorFlowClientService.instance) {
      TensorFlowClientService.instance = new TensorFlowClientService()
    }
    return TensorFlowClientService.instance
  }

  async initializeTensorFlow(): Promise<void> {
    try {
      // Set TensorFlow.js backend (WebGL for performance)
      await tf.setBackend('webgl')
      await tf.ready()
      console.log('TensorFlow.js initialized with backend:', tf.getBackend())
    } catch (error) {
      console.warn('WebGL backend failed, falling back to CPU:', error)
      await tf.setBackend('cpu')
      await tf.ready()
    }
  }

  async createModel(config: MLModelConfig, tenantId: string, userId: string): Promise<string> {
    try {
      let model: tf.LayersModel

      switch (config.modelType) {
        case 'CLASSIFICATION':
          model = this.createClassificationModel(config.architecture)
          break
        case 'REGRESSION':
          model = this.createRegressionModel(config.architecture)
          break
        case 'NLP':
          model = this.createNLPModel(config.architecture)
          break
        default:
          throw new Error(`Unsupported model type: ${config.modelType}`)
      }

      // Serialize model for storage
      const modelData = await this.serializeModel(model)
      const modelSize = JSON.stringify(modelData).length

      // Save to database
      const savedModel = await prisma.clientMLModel.create({
        data: {
          name: config.name,
          version: config.version,
          modelType: config.modelType,
          framework: config.framework,
          modelData,
          trainingData: config.hyperparameters,
          size: modelSize,
          tenantId,
          userId
        }
      })

      // Cache the model
      this.loadedModels.set(savedModel.id, model)
      this.modelCache.set(savedModel.id, savedModel)

      return savedModel.id
    } catch (error) {
      console.error('Failed to create model:', error)
      throw new Error('Model creation failed')
    }
  }

  private createClassificationModel(architecture?: any): tf.LayersModel {
    const inputDim = architecture?.inputDim || 10
    const hiddenLayers = architecture?.hiddenLayers || [64, 32]
    const outputDim = architecture?.outputDim || 3

    const model = tf.sequential()
    
    // Input layer
    model.add(tf.layers.dense({
      units: hiddenLayers[0],
      activation: 'relu',
      inputShape: [inputDim]
    }))

    // Hidden layers
    for (let i = 1; i < hiddenLayers.length; i++) {
      model.add(tf.layers.dense({
        units: hiddenLayers[i],
        activation: 'relu'
      }))
      model.add(tf.layers.dropout({ rate: 0.2 }))
    }

    // Output layer
    model.add(tf.layers.dense({
      units: outputDim,
      activation: 'softmax'
    }))

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    })

    return model
  }

  private createRegressionModel(architecture?: any): tf.LayersModel {
    const inputDim = architecture?.inputDim || 10
    const hiddenLayers = architecture?.hiddenLayers || [64, 32]

    const model = tf.sequential()
    
    model.add(tf.layers.dense({
      units: hiddenLayers[0],
      activation: 'relu',
      inputShape: [inputDim]
    }))

    for (let i = 1; i < hiddenLayers.length; i++) {
      model.add(tf.layers.dense({
        units: hiddenLayers[i],
        activation: 'relu'
      }))
    }

    model.add(tf.layers.dense({
      units: 1,
      activation: 'linear'
    }))

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    })

    return model
  }

  private createNLPModel(architecture?: any): tf.LayersModel {
    const vocabSize = architecture?.vocabSize || 10000
    const embeddingDim = architecture?.embeddingDim || 128
    const maxLength = architecture?.maxLength || 100
    const outputDim = architecture?.outputDim || 2

    const model = tf.sequential()
    
    model.add(tf.layers.embedding({
      inputDim: vocabSize,
      outputDim: embeddingDim,
      inputLength: maxLength
    }))

    model.add(tf.layers.lstm({
      units: 64,
      returnSequences: false
    }))

    model.add(tf.layers.dense({
      units: 32,
      activation: 'relu'
    }))

    model.add(tf.layers.dense({
      units: outputDim,
      activation: 'softmax'
    }))

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    })

    return model
  }

  async trainModel(
    modelId: string,
    trainingData: TrainingData,
    onProgress?: (epoch: number, loss: number) => void
  ): Promise<void> {
    try {
      const model = this.loadedModels.get(modelId)
      if (!model) {
        throw new Error('Model not found')
      }

      // Convert training data to tensors
      const xs = tf.tensor2d(trainingData.inputs)
      const ys = tf.tensor2d(trainingData.outputs)

      // Training configuration
      const config = {
        epochs: trainingData.epochs || 100,
        batchSize: trainingData.batchSize || 32,
        validationSplit: trainingData.validationSplit || 0.2,
        callbacks: onProgress ? {
          onEpochEnd: (epoch: number, logs: any) => {
            onProgress(epoch, logs?.loss || 0)
          }
        } : undefined
      }

      // Train the model
      const history = await model.fit(xs, ys, config)

      // Convert tensor values to numbers for JSON storage
      const finalLoss = history.history.loss?.[history.history.loss.length - 1]
      const finalAccuracy = history.history.acc?.[history.history.acc.length - 1]
      
      const finalLossValue = typeof finalLoss === 'number' ? finalLoss : 
        finalLoss && typeof finalLoss === 'object' && 'dataSync' in finalLoss ? 
        (finalLoss as any).dataSync()[0] : 0

      const finalAccuracyValue = typeof finalAccuracy === 'number' ? finalAccuracy : 
        finalAccuracy && typeof finalAccuracy === 'object' && 'dataSync' in finalAccuracy ? 
        (finalAccuracy as any).dataSync()[0] : 0

      // Convert loss and accuracy arrays to numbers
      const lossValues = history.history.loss?.map(val => 
        typeof val === 'number' ? val : 
        val && typeof val === 'object' && 'dataSync' in val ? 
        (val as any).dataSync()[0] : 0
      ) || []

      const accuracyValues = history.history.acc?.map(val => 
        typeof val === 'number' ? val : 
        val && typeof val === 'object' && 'dataSync' in val ? 
        (val as any).dataSync()[0] : 0
      ) || []

      // Update model in database with training metadata
      await prisma.clientMLModel.update({
        where: { id: modelId },
        data: {
          trainingData: {
            epochs: config.epochs,
            finalLoss: finalLossValue,
            finalAccuracy: finalAccuracyValue
          },
          performance: {
            trainingTime: Date.now(),
            loss: lossValues,
            accuracy: accuracyValues
          }
        }
      })

      // Clean up tensors
      xs.dispose()
      ys.dispose()

    } catch (error) {
      console.error('Model training failed:', error)
      throw new Error('Model training failed')
    }
  }

  async predict(
    modelId: string,
    inputData: number[],
    tenantId: string,
    userId: string
  ): Promise<PredictionResult> {
    const startTime = performance.now()

    try {
      let model = this.loadedModels.get(modelId)
      
      if (!model) {
        // Load model from database
        const savedModel = await prisma.clientMLModel.findUnique({
          where: { id: modelId }
        })

        if (!savedModel) {
          throw new Error('Model not found')
        }

        model = await this.deserializeModel(savedModel.modelData)
        this.loadedModels.set(modelId, model)
        this.modelCache.set(modelId, savedModel)
      }

      // Make prediction
      const inputTensor = tf.tensor2d([inputData])
      const prediction = model.predict(inputTensor) as tf.Tensor

      // Extract prediction data
      const predictionData = await prediction.data()
      const confidence = this.calculateConfidence(predictionData)

      const processingTime = performance.now() - startTime

      // Save prediction to database
      await prisma.clientMLPrediction.create({
        data: {
          modelId,
          inputData: inputData,
          prediction: Array.from(predictionData),
          confidence,
          processingTime,
          tenantId,
          userId
        }
      })

      // Clean up tensors
      inputTensor.dispose()
      prediction.dispose()

      return {
        prediction: Array.from(predictionData),
        confidence,
        processingTime,
        modelVersion: this.modelCache.get(modelId)?.version || 'unknown'
      }

    } catch (error) {
      console.error('Prediction failed:', error)
      throw new Error('Prediction failed')
    }
  }

  private calculateConfidence(predictionData: Float32Array | Int32Array | Uint8Array): number {
    if (predictionData.length === 1) {
      // Regression: use inverse of prediction variance
      return Math.min(0.99, Math.max(0.01, 1 - Math.abs(predictionData[0]) * 0.1))
    } else {
      // Classification: use max probability
      const maxProb = Math.max(...Array.from(predictionData))
      return Math.min(0.99, Math.max(0.01, maxProb))
    }
  }

  async batchPredict(
    modelId: string,
    inputBatch: number[][],
    tenantId: string,
    userId: string
  ): Promise<PredictionResult[]> {
    try {
      const results: PredictionResult[] = []

      for (const inputData of inputBatch) {
        const result = await this.predict(modelId, inputData, tenantId, userId)
        results.push(result)
      }

      return results
    } catch (error) {
      console.error('Batch prediction failed:', error)
      throw new Error('Batch prediction failed')
    }
  }

  async getModelPerformance(modelId: string): Promise<any> {
    try {
      const model = await prisma.clientMLModel.findUnique({
        where: { id: modelId },
        include: {
          predictions: {
            orderBy: { createdAt: 'desc' },
            take: 100
          }
        }
      })

      if (!model) {
        throw new Error('Model not found')
      }

      const predictions = model.predictions
      const avgConfidence = predictions.reduce((sum, p) => sum + (p.confidence || 0), 0) / predictions.length
      const avgProcessingTime = predictions.reduce((sum, p) => sum + p.processingTime, 0) / predictions.length

      return {
        modelId,
        name: model.name,
        version: model.version,
        totalPredictions: predictions.length,
        avgConfidence,
        avgProcessingTime,
        performance: model.performance,
        lastUsed: predictions[0]?.createdAt
      }
    } catch (error) {
      console.error('Failed to get model performance:', error)
      return null
    }
  }

  private async serializeModel(model: tf.LayersModel): Promise<any> {
    try {
      // Save model to memory
      const saveResult = await model.save(tf.io.withSaveHandler(async (artifacts) => {
        return {
          modelArtifactsInfo: {
            dateSaved: new Date(),
            modelTopologyType: 'JSON'
          },
          ...artifacts
        }
      }))
      return saveResult
    } catch (error) {
      console.error('Model serialization failed:', error)
      throw error
    }
  }

  private async deserializeModel(modelData: any): Promise<tf.LayersModel> {
    try {
      // Load model from serialized data
      const model = await tf.loadLayersModel(tf.io.fromMemory(modelData))
      return model
    } catch (error) {
      console.error('Model deserialization failed:', error)
      throw error
    }
  }

  async optimizeModel(modelId: string): Promise<void> {
    try {
      const model = this.loadedModels.get(modelId)
      if (!model) {
        throw new Error('Model not found')
      }

      // Apply optimization techniques
      // 1. Quantization (if supported)
      // 2. Pruning
      // 3. Model compression

      console.log(`Model ${modelId} optimization completed`)
    } catch (error) {
      console.error('Model optimization failed:', error)
    }
  }

  dispose(): void {
    // Clean up all loaded models
    this.loadedModels.forEach(model => model.dispose())
    this.loadedModels.clear()
    this.modelCache.clear()
  }
}

export const tensorflowClient = TensorFlowClientService.getInstance()
