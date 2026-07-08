//-----------------------------------------------------------------------
// <copyright file="ColorHelper.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2010 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.Drawing
{
    using System;
    using System.Collections.Generic;
    using System.Drawing;
    using System.Text;
   
    /// <summary>
    /// Provides methods to manipulate a <see cref="System.Drawing.Color"/>
    /// </summary>
    public class ColorHelper
    {               
        /// <summary>
        /// Makes a Color darker by a specified percent
        /// </summary>
        /// <param name="start">The start Color</param>
        /// <param name="amount">The percent black (0.0 - 1.0)</param>
        /// <returns>The darker color</returns>
        public static Color Darker(Color start, float amount)
        {
            return Lerp(start, Color.Black, amount);
        }

        /// <summary>
        /// Makes a Color lighter by a specified percent
        /// </summary>
        /// <param name="start">The start Color</param>
        /// <param name="amount">The percent white (0.0 - 1.0)</param>
        /// <returns>The lighter color</returns>
        public static Color Lighter(Color start, float amount)
        {
            Color result;

            result = Lerp(start, Color.White, amount);
            return result;
        }

        public static Color Lerp(Color start, Color end, float amount)
        {
            byte r, g, b;

            r = (byte)Lerp(start.R, end.R, amount);
            g = (byte)Lerp(start.G, end.G, amount);
            b = (byte)Lerp(start.B, end.B, amount);

            return Color.FromArgb(r, g, b);
        }

        // TODO: move to another class
        private static float Lerp(float start, float end, float amount)
        {
            float adjusted = (end - start) * amount;
            return start + adjusted;
        }
    }
}
