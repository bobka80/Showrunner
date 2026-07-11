//-----------------------------------------------------------------------
// <copyright file="RenderRssi.cs" company="Technology Solutions UK Ltd"> 
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
    /// Takes an RSSI from the Ratel reader and provides it as a percentage
    /// </summary>
    public class RenderRssi
    {
        /// <summary>
        /// The minimum RSSI
        /// </summary>
        private int minRssi = 20;

        /// <summary>
        /// The maximum RSSI
        /// </summary>
        private int maxRssi = 55;

        /// <summary>
        /// The current RSSI value
        /// </summary>
        private int value;

        /// <summary>
        /// Gets or sets the maximum expected RSSI value
        /// </summary>
        public int Maximum
        {
            get
            {
                return this.maxRssi;
            }

            set
            {
                this.maxRssi = value;
            }
        }

        /// <summary>
        /// Gets or sets the minimum expected RSSI value
        /// </summary>
        public int Minimum
        {
            get
            {
                return this.minRssi;
            }

            set
            {
                this.minRssi = value;
            }
        }

        /// <summary>
        /// Gets or sets the RSSI value
        /// </summary>
        public int Value
        {
            get
            {
                return this.value;
            }

            set
            {
                this.value = value;
            }
        }

        /// <summary>
        /// Gets the RSSI value as a percentage
        /// </summary>
        public int Percent
        {
            get
            {
                return Convert.ToInt32(this.Fraction * 100.0f);
            }
        }

        /// <summary>
        /// Gets the RSSI value as a factor between 0 and 1
        /// </summary>
        public float Fraction
        {
            get
            {
                float value;

                value = (float)(this.Value - this.Minimum) / (this.Maximum - this.Minimum);
                if (value > 1.0f)
                {
                    value = 1.0f;
                }
                else if (value < 0.0f)
                {
                    value = 0.0f;
                }

                return value;
            }
        }
    }
}
