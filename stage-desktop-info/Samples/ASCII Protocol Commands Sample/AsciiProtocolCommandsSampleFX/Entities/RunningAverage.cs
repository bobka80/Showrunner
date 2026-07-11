//-----------------------------------------------------------------------
// <copyright file="RunningAverage.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2010 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.Entities
{
    using System;
    using System.Collections.Generic;
    using System.Text;

    /// <summary>
    /// Calculates and tracks a running average
    /// </summary>
    public class RunningAverage
    {
        /// <summary>
        /// The values to average
        /// </summary>
        private int[] values;

        /// <summary>
        /// The current index of the newest value
        /// </summary>
        private int index;

        /// <summary>
        /// Initializes a new instance of the RunningAverage class
        /// </summary>
        /// <param name="count">The number of values to average over</param>
        public RunningAverage(byte count)
        {
            this.values = new int[count];
        }        

        /// <summary>
        /// Gets the current average
        /// </summary>
        public int Average
        {
            get
            {
                int max;
                int sum;

                if (this.index == 0)
                {
                    return 0;
                }

                max = this.index;
                if (max > this.values.Length)
                {
                    max = this.values.Length;
                }

                sum = 0;
                for (int i = 0; i < max; i++)
                {
                    sum += this.values[i];
                }

                return sum / max;
            }
        }

        /// <summary>
        /// Appends a value to calculate
        /// </summary>
        /// <param name="value">The value to append</param>
        public void AddEntry(int value)
        {
            this.values[this.index % this.values.Length] = value;
            this.index += 1;

            if (this.index >= this.values.Length * 2)
            {
                this.index = this.values.Length;
            }
        }
    }
}
