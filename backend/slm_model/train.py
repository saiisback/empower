"""
train.py
This script handles the fine-tuning of the SLM model on custom data.
It includes argument parsing, data preprocessing, a custom dataset class,
and a training loop using the Hugging Face Trainer.
"""

import os
import argparse
import logging
import pandas as pd
from datasets import Dataset as HFDataset
import torch
from torch.utils.data import Dataset
from transformers import (
    Trainer,
    TrainingArguments,
    AutoTokenizer,
    AutoModelForCausalLM,
    DataCollatorForLanguageModeling,
)
from model import SLMModel, ModelConfig

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SpecialNeedsDataset(Dataset):
    """Custom PyTorch Dataset for our special needs text data."""
    def __init__(self, tokenizer: AutoTokenizer, file_path: str, block_size: int):
        logger.info(f"Loading and tokenizing data from {file_path}")
        
        df = pd.read_csv(file_path)
        # Create a formatted string for each row
        formatted_texts = [
            f"Age: {row['age']}, Disability: {row['disability']} -> {row['text']}"
            for _, row in df.iterrows()
        ]
        
        # Concatenate all texts and tokenize
        concatenated_texts = "\n".join(formatted_texts)
        self.examples = tokenizer(
            concatenated_texts,
            add_special_tokens=True,
            truncation=False,
            return_attention_mask=False,
        )["input_ids"]

        self.block_size = block_size
        self._create_blocks()

    def _create_blocks(self):
        # Group texts into blocks of size `block_size`
        self.blocks = []
        total_length = len(self.examples)
        for i in range(0, total_length - self.block_size + 1, self.block_size):
            self.blocks.append(self.examples[i : i + self.block_size])
        logger.info(f"Created {len(self.blocks)} blocks of size {self.block_size}")

    def __len__(self):
        return len(self.blocks)

    def __getitem__(self, i):
        return torch.tensor(self.blocks[i], dtype=torch.long)

def parse_args():
    """Parses command-line arguments for training."""
    parser = argparse.ArgumentParser(description="Fine-tune an SLM model for specially abled kids.")
    
    # Model and data arguments
    parser.add_argument("--model_name", type=str, default="distilgpt2", help="Base model to fine-tune.")
    parser.add_argument("--data_path", type=str, default="data/special_kids_texts.csv", help="Path to the training data CSV.")
    parser.add_argument("--output_dir", type=str, default="slm_model_trained", help="Directory to save the trained model.")
    
    # Training hyperparameters
    parser.add_argument("--num_train_epochs", type=int, default=3, help="Number of training epochs.")
    parser.add_argument("--per_device_train_batch_size", type=int, default=4, help="Batch size for training.")
    parser.add_argument("--per_device_eval_batch_size", type=int, default=4, help="Batch size for evaluation.")
    parser.add_argument("--learning_rate", type=float, default=5e-5, help="Learning rate.")
    parser.add_argument("--weight_decay", type=float, default=0.01, help="Weight decay.")
    parser.add_argument("--warmup_steps", type=int, default=50, help="Number of warmup steps.")
    parser.add_argument("--block_size", type=int, default=128, help="Block size for tokenizing.")
    
    # Other arguments
    parser.add_argument("--do_eval", action='store_true', help="Whether to run evaluation on a validation set.")
    parser.add_argument("--eval_data_path", type=str, default=None, help="Path to evaluation data CSV.")
    parser.add_argument("--logging_steps", type=int, default=10, help="Log every X updates steps.")
    parser.add_argument("--save_steps", type=int, default=500, help="Save checkpoint every X updates steps.")
    parser.add_argument("--report_to", type=str, default="none", help="Where to report metrics (e.g., 'wandb', 'tensorboard').")

    return parser.parse_args()

def main():
    """Main function to run the training script."""
    args = parse_args()
    logger.info(f"Starting training with arguments: {args}")

    # 1. Load Tokenizer and Model
    logger.info(f"Loading base model '{args.model_name}'")
    tokenizer = AutoTokenizer.from_pretrained(args.model_name)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
        
    model = AutoModelForCausalLM.from_pretrained(args.model_name)

    # 2. Prepare Datasets
    logger.info("Preparing datasets...")
    train_dataset = SpecialNeedsDataset(tokenizer, args.data_path, args.block_size)
    eval_dataset = SpecialNeedsDataset(tokenizer, args.eval_data_path, args.block_size) if args.do_eval and args.eval_data_path else None

    # Data collator will take care of creating batches and labels
    data_collator = DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False)

    # 3. Define Training Arguments
    training_args = TrainingArguments(
        output_dir=args.output_dir,
        overwrite_output_dir=True,
        num_train_epochs=args.num_train_epochs,
        per_device_train_batch_size=args.per_device_train_batch_size,
        per_device_eval_batch_size=args.per_device_eval_batch_size,
        learning_rate=args.learning_rate,
        weight_decay=args.weight_decay,
        warmup_steps=args.warmup_steps,
        evaluation_strategy="steps" if args.do_eval else "no",
        eval_steps=args.save_steps if args.do_eval else None,
        logging_dir=f"{args.output_dir}/logs",
        logging_steps=args.logging_steps,
        save_steps=args.save_steps,
        save_total_limit=3,
        fp16=torch.cuda.is_available(), # Use mixed precision if CUDA is available
        report_to=args.report_to,
    )

    # 4. Initialize Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=eval_dataset,
        tokenizer=tokenizer,
        data_collator=data_collator,
    )

    # 5. Start Training
    logger.info("Starting model training...")
    train_result = trainer.train()
    logger.info("Training finished.")

    # 6. Save the final model and tokenizer
    trainer.save_model()
    trainer.log_metrics("train", train_result.metrics)
    trainer.save_metrics("train", train_result.metrics)
    trainer.save_state()
    
    logger.info(f"Model and tokenizer saved to {args.output_dir}")

    # 7. Save the model config for later use with SLMModel class
    config = ModelConfig(
        model_name=args.output_dir, # The path to the trained model
        max_length=args.block_size
    )
    config.to_json(os.path.join(args.output_dir, "model_config.json"))
    logger.info(f"Model config saved to {args.output_dir}/model_config.json")

